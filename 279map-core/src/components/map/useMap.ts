import { useCallback, useMemo, useRef } from 'react';
import { OlMapWrapper } from '../TsunaguMap/OlMapWrapper';
import { atom, useAtom } from 'jotai';
import { useAtomCallback, atomWithReducer } from 'jotai/utils';
import { defaultExtentAtom, instanceIdAtom } from '../../store/session';
import { GetItemsAPI, GetItemsParam } from 'tsunagumap-api';
import { ItemsMap, LoadedItemKey, allItemsAtom, loadedItemKeysAtom } from '../../store/item';
import { DataId, Extent } from '279map-common';
import { dataSourcesAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import useMyMedia from '../../util/useMyMedia';
import { selectedItemIdsAtom } from '../../store/operation';
import Feature from "ol/Feature";
import { Geometry } from 'ol/geom';
import { sleep } from '../../util/CommonUtility';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useApi } from '../../api/useApi';
import { initialLoadingAtom } from '../TsunaguMap/EventFire';

const instansMap = new Map<string, OlMapWrapper>();

// OlMapWrapperの生成回数。再生成した時にmap参照しているコンポーネントで再レンダリングを走らせるために用いている。
const mapInstanceCntReducerAtom = atomWithReducer(0, (prev) => {
    return prev + 1;
});
const mapIdAtom = atom((get) => {
    const instanceId = get(instanceIdAtom);
    const cnt = get(mapInstanceCntReducerAtom);
    return instanceId + cnt;
})

/**
 * mapインスタンスを操作するためのフック
 * @returns 
 */
export function useMap() {
    const { isPC } = useMyMedia();
    const [_, dispatch] = useAtom(mapInstanceCntReducerAtom);

    /**
     * 地図インスタンスを生成する
     * @param target 地図を配置するDivElement
     * @param デバイス種別
     * @returns 地図インスタンス
     */
    const createMapInstance = useAtomCallback(
        useCallback((get, set, target: HTMLDivElement) => {
            dispatch();
            const mapId = get(mapIdAtom);
            const map = new OlMapWrapper(mapId, target, isPC ? 'pc' : 'sp');
            console.log('create map', mapId);

            instansMap.set(mapId, map);
            return map;
        }, [dispatch, isPC])
    );

    const destroyMapInstance = useAtomCallback(
        useCallback((get) => {
            const mapId = get(mapIdAtom);
            const map = instansMap.get(mapId);
            if (!map) return;
            console.log('destroy map', mapId);

            map.dispose();
            instansMap.delete(mapId);
        }, [])
    )

    const [mapId] = useAtom(mapIdAtom);
    const map = useMemo(() => {
        // console.log('debug map', mapId);
        return instansMap.get(mapId);
    }, [mapId]);

    const { callApi } = useApi();
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

   /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
   const loadItems = useAtomCallback(
    useCallback(async(get, set, param: Omit<GetItemsParam, 'dataSourceIds'>) => {
        try {
            const overlay = get(initialLoadingAtom);
            const h = showProcessMessage({
                overlay, // 初回ロード時はoverlay表示
                spinner: true,
            });

            // 未ロードのデータのみロードする
            // -- extentは一定サイズに分割する
            const extents = divideExtent(param.extent);
            // -- zoomは小数点以下は切り捨てる
            const zoom = Math.floor(param.zoom);
            const loadedItemsKeys = get(loadedItemKeysAtom);
            const datasources = get(dataSourcesAtom);
            const visibleDataSourceIds = get(visibleDataSourceIdsAtom);

            const targetKeys = extents.reduce((acc, cur) => {
                const keys = visibleDataSourceIds.map((datasourceId): LoadedItemKey => {
                    // データソースがGPXの場合は、ZoomLv.も
                    const dsInfo = datasources.find(ds => ds.dataSourceId === datasourceId);
                    const zoomKey = dsInfo?.itemContents.Track ? zoom : undefined;
                    return {
                        datasourceId,
                        extent: cur.concat(),   // combineKeys処理でデータソースごとにExtentに対して処理を行うので、別オブジェクトとして代入
                        zoom: zoomKey,
                    }
                });
                return acc.concat(keys);
            }, [] as LoadedItemKey[])
            .filter(key => {
                return !loadedItemsKeys.some(loaded => {
                    if (loaded.datasourceId !== key.datasourceId) {
                        return false;
                    }
                    if (JSON.stringify(loaded.extent) !== JSON.stringify(key.extent)) {
                        return false;
                    }
                    if (loaded.zoom && loaded.zoom !== key.zoom) {
                        return false;
                    }
                    return true;
                });
            });

            if (targetKeys.length === 0) return;

            // ひとまとめにできる条件は、ひとまとめにする
            const combinedKeys = combineKeys(targetKeys);

            for (const key of combinedKeys) {
                const apiResult = await callApi(GetItemsAPI, {
                    extent: key.extent,
                    zoom,
                    dataSourceIds: [key.datasourceId],
                });
                const items = apiResult.items;

                // ロード済みデータ条件を保管
                set(loadedItemKeysAtom, (current) => {
                    return current.concat(key);
                })

                if (items.length === 0) continue;

                const itemMap: ItemsMap = {};
                items.forEach(item => {
                    itemMap[item.id.id] = item;
                });
                set(allItemsAtom, (currentItemMap) => {
                    const newItemsMap = Object.assign({}, currentItemMap, {
                        [key.datasourceId]: itemMap,
                    });
                    return newItemsMap;
                })
            }
            hideProcessMessage(h);

        } catch (e) {
            console.warn('loadItems error', e);
            throw e;
        }

    }, [callApi, showProcessMessage, hideProcessMessage])
)

    /**
     * 現在の地図表示範囲内に存在するコンテンツをロードする
     */
    const loadingCurrentAreaContents = useRef(false);
    const loadCurrentAreaContents = useCallback(async() => {
        console.log('loadCurrentAreaContents');
        if (!map) {
            console.warn('map is undefined');
            return;
        }
        if (loadingCurrentAreaContents.current) {
            // 二重起動禁止
            console.log('二重起動禁止');
            return;
        }
        const zoom = map.getZoom();
        if (!zoom) {
            return;
        }
        loadingCurrentAreaContents.current = true;
        const ext = map.getExtent();

        await loadItems({zoom, extent: ext});

        loadingCurrentAreaContents.current = false;

    }, [loadItems, map]);

    /**
     * 全アイテムが含まれる領域でフィットさせる
     */
    const fitToDefaultExtent = useAtomCallback(
        useCallback((get, set, animation: boolean) => {
            const defaultExtent = get(defaultExtentAtom); 
            if (!defaultExtent || !map) {
                return;
            }
            // アイテム0件の時はフィットさせない
            if (defaultExtent.some(i => i !== 0)) {
                map.fit(defaultExtent, {
                    animation,
                });
            }

        }, [map])
    );

    /**
     * 指定のitemにfitさせる
     */
    const focusItem = useAtomCallback(
        useCallback(async(get, set, param: {itemId: DataId; zoom?: boolean}) => {
            if (!map) {
                return;
            }
    
            const getFeatureFunc = async() => {
                let itemFeature: undefined | Feature<Geometry>;
                let retryCnt = 0;
                do {
                    itemFeature = map.getFeatureById(param.itemId);
                    if (!itemFeature) {
                        // アイテムが存在しない場合は、データロード中の可能性があるので、しばらく待ってからリトライ
                        retryCnt++;
                        await sleep(0.5);
                    } else {
                        return itemFeature;
                    }
                } while(itemFeature === undefined && retryCnt < 5);
                return itemFeature;
            };
            const itemFeature = await getFeatureFunc();
            if (!itemFeature) {
                console.warn('focusItem target not found', param.itemId);
                return;
            }
    
            const ext = itemFeature.getGeometry()?.getExtent();
            if (!ext) return;
            map.fit(ext, {
                animation: true,
                zoom: param.zoom,
            });
    
            set(selectedItemIdsAtom, [param.itemId]);
        }, [map])
    )
 
    return {
        createMapInstance,
        destroyMapInstance,
        map,
        loadCurrentAreaContents,
        fitToDefaultExtent,
        focusItem,
    }
}

function divideExtent(ext: Extent): Extent[] {
    const d = 10;
    const startX = Math.floor(Math.min(ext[0], ext[2]) / d) * d;
    const endX = Math.max(ext[0], ext[2]);
    const startY = Math.floor(Math.min(ext[1], ext[3]) / d) * d;
    const endY = Math.max(ext[1], ext[3]);

    const list = [] as Extent[];
    for (let y = startY; y<=endY; y+=d) {
        for (let x = startX; x <= endX; x+=d) {
            list.push([
                x, y, x + d, y + d
            ])
        }
    }
    return list;
}
function combineKeys(keys: LoadedItemKey[]): LoadedItemKey[] {
    // データソースごとに、まとめる
    const keyMap = new Map<string, LoadedItemKey[]>();
    keys.forEach(key => {
        if (keyMap.has(key.datasourceId)) {
            keyMap.get(key.datasourceId)?.push(key);
        } else {
            keyMap.set(key.datasourceId, [key]);
        }
    });

    // Extentが隣接するものは１つにする
    const combinedList = [] as LoadedItemKey[];
    keyMap.forEach((value) => {
        // -- X軸でまとめられるものをまとめる
        const list = value.reduce((acc, cur) => {
            if (acc.length === 0) {
                return [cur];
            }
            const lastItem = acc[acc.length - 1];
            if (lastItem.extent[1] !== cur.extent[1] || lastItem.extent[3] !== cur.extent[3]) {
                // Y座標がことなる場合はまとめない
                return acc.concat(cur);
            }
            if (lastItem.extent[2] !== cur.extent[0]) {
                // 隣接していない場合はまとめない
                return acc.concat(cur);
            }
            // まとめる
            lastItem.extent[2] = cur.extent[2];
            return acc;
        }, [] as LoadedItemKey[])
        // -- Y軸でまとめられるものをまとめる
        .reduce((acc, cur) => {
            if (acc.length === 0) {
                return [cur];
            }
            const lastItem = acc[acc.length - 1];

            if (lastItem.extent[0] !== cur.extent[0] || lastItem.extent[2] !== cur.extent[2]) {
                // X座標がことなる場合はまとめない
                return acc.concat(cur);
            }
            if (lastItem.extent[3] !== cur.extent[1]) {
                // 隣接していない場合はまとめない
                return acc.concat(cur);
            }
            // まとめる
            lastItem.extent[3] = cur.extent[3];
            return acc;
        }, [] as LoadedItemKey[]);
        
        Array.prototype.push.apply(combinedList, list);
    })

    return combinedList;
}
