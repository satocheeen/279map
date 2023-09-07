import { useCallback, useMemo, useRef } from 'react';
import { OlMapWrapper } from '../TsunaguMap/OlMapWrapper';
import { atom, useAtom } from 'jotai';
import { useAtomCallback, atomWithReducer } from 'jotai/utils';
import { defaultExtentAtom, instanceIdAtom } from '../../store/session';
import { GetItemsAPI, GetItemsParam } from 'tsunagumap-api';
import { ItemsMap, LoadedItemInfo, allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { DataId, Extent } from '279map-common';
import { dataSourcesAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import useMyMedia from '../../util/useMyMedia';
import { selectedItemIdsAtom } from '../../store/operation';
import Feature from "ol/Feature";
import { Geometry } from 'ol/geom';
import { sleep } from '../../util/CommonUtility';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useApi } from '../../api/useApi';
import { initialLoadingAtom } from '../TsunaguMap/MapController';
import { checkContaining, convertTurfPolygon } from '../../util/MapUtility';
import * as turf from '@turf/turf';
// @ts-ignore
import { stringify as wktStringify } from 'wkt';

/**
 * 地図インスタンス管理マップ。
 * TsunaguMapが呼び出し元で複数配置される可能性を考慮して、
 * idをkeyにして、複数保持できるようにしている。
 */
const instansMap = new Map<string, OlMapWrapper>();

// OlMapWrapperの生成回数。再生成した時にmap参照しているコンポーネントで再レンダリングを走らせるために用いている。
const mapInstanceCntReducerAtom = atomWithReducer(0, (prev) => {
    return prev + 1;
});
// 現在使用している地図インスタンスID
export const mapInstanceIdAtom = atom('');

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
     * @returns 地図ID
     */
    const createMapInstance = useAtomCallback(
        useCallback((get, set, target: HTMLDivElement) => {
            dispatch();
            const mapInstanceId = get(instanceIdAtom) + '-' + get(mapInstanceCntReducerAtom);
            set(mapInstanceIdAtom, mapInstanceId);
            const map = new OlMapWrapper(mapInstanceId, target, isPC ? 'pc' : 'sp');
            console.log('create map', mapInstanceId);

            instansMap.set(mapInstanceId, map);
            return mapInstanceId;
        }, [dispatch, isPC])
    );

    const destroyMapInstance = useAtomCallback(
        useCallback((get, set, mapId: string) => {
            const map = instansMap.get(mapId);
            if (!map) return;
            console.log('destroy map', mapId);

            map.dispose();
            instansMap.delete(mapId);
        }, [])
    )

    const [mapInstanceId] = useAtom(mapInstanceIdAtom);
    const map = useMemo(() => {
        return instansMap.get(mapInstanceId);
    }, [mapInstanceId]);

    const { callApi } = useApi();
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

   /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
   const loadItems = useAtomCallback(
    useCallback(async(get, set, param: { extent: Extent; zoom: number }) => {
        const overlay = get(initialLoadingAtom);
        const h = showProcessMessage({
            overlay, // 初回ロード時はoverlay表示
            spinner: true,
        });
        set(initialLoadingAtom, false);

        try {
            // 未ロードのデータのみロードする
            // -- zoomは小数点以下は切り捨てる
            const zoom = Math.floor(param.zoom);
            const loadedItemMap = get(loadedItemMapAtom);
            const visibleDataSourceIds = get(visibleDataSourceIdsAtom);

            const extentPolygon = convertTurfPolygon(param.extent);
            // ロード対象
            const loadTargets = visibleDataSourceIds.map((datasourceId): LoadedItemInfo => {
                // ロード済みの範囲は除外したPolygonを生成
                const loadedInfo = loadedItemMap[datasourceId];
                let polygon: LoadedItemInfo['polygon'];
                if (loadedInfo) {
                    if (loadedInfo.polygon.type === 'Polygon') {
                        const loadedPolygon = turf.polygon(loadedInfo.polygon.coordinates);
                        const p = turf.mask(loadedPolygon, extentPolygon)
                        polygon = {
                            type: 'Polygon',
                            coordinates: p.geometry.coordinates,
                        }
                    } else {
                        const loadedPolygon = turf.multiPolygon(loadedInfo.polygon.coordinates);
                        const p = turf.mask(loadedPolygon, extentPolygon)
                        polygon = {
                            type: 'Polygon',
                            coordinates: p.geometry.coordinates,
                        }
                    }
                } else {
                    polygon = {
                        type: 'Polygon',
                        coordinates: extentPolygon.geometry.coordinates
                    }
                }
                return {
                    datasourceId,
                    polygon,
                }
            });
            console.log('debug loadTargets', loadTargets);
            console.log('debug newLoaded', get(loadedItemMapAtom));
            // const targetKeys = extents.reduce((acc, cur) => {
            //     const keys = visibleDataSourceIds.map((datasourceId): LoadedItemKey => {
            //         // データソースがGPXの場合は、ZoomLv.も
            //         const dsInfo = datasources.find(ds => ds.dataSourceId === datasourceId);
            //         const zoomKey = dsInfo?.itemContents.Track ? zoom : undefined;
            //         return {
            //             datasourceId,
            //             extent: cur.concat(),   // combineKeys処理でデータソースごとにExtentに対して処理を行うので、別オブジェクトとして代入
            //             zoom: zoomKey,
            //         }
            //     });
            //     return acc.concat(keys);
            // }, [] as LoadedItemKey[])
            // .filter(key => {
            //     const loaded =loadedItemsKeys.some(loaded => {
            //         if (loaded.datasourceId !== key.datasourceId) {
            //             return false;
            //         }
            //         if (JSON.stringify(loaded.extent) !== JSON.stringify(key.extent)) {
            //             return false;
            //         }
            //         if (loaded.zoom && loaded.zoom !== key.zoom) {
            //             return false;
            //         }
            //         return true;
            //     });
            //     return !loaded;
            // });

            // if (targetKeys.length === 0) return;

            // const copiedTargetKeys = JSON.parse(JSON.stringify(targetKeys));
            // // ひとまとめにできる条件は、ひとまとめにする
            // const combinedKeys = combineKeys(targetKeys);

            for (const target of loadTargets) {
                const wkt = wktStringify(target.polygon) as string;
                const apiResult = await callApi(GetItemsAPI, {
                    wkt,
                    zoom,
                    dataSourceIds: [target.datasourceId],
                });
                const items = apiResult.items;

                if (items.length === 0) continue;

                const itemMap: ItemsMap = get(allItemsAtom)[target.datasourceId] ?? {};
                items.forEach(item => {
                    itemMap[item.id.id] = item;
                });
                set(allItemsAtom, (currentItemMap) => {
                    const newItemsMap = Object.assign({}, currentItemMap, {
                        [target.datasourceId]: itemMap,
                    });
                    return newItemsMap;
                })
            }
            // ロード済みの範囲と併せたものを保管
            loadTargets.forEach(info => {
                const currentData = loadedItemMap[info.datasourceId];
                let polygon: LoadedItemInfo['polygon'];
                if (currentData) {
                    const newPolygon = turf.union(
                        currentData.polygon.type === 'Polygon' ? turf.polygon(currentData.polygon.coordinates) : turf.multiPolygon(currentData.polygon.coordinates),
                        info.polygon.type === 'Polygon' ? turf.polygon(info.polygon.coordinates) : turf.multiPolygon(info.polygon.coordinates),
                    );
                    if (newPolygon) {
                        polygon = newPolygon.geometry.type === 'Polygon' ? {
                            type: newPolygon.geometry.type,
                            coordinates: newPolygon.geometry.coordinates,
                        } : {
                            type: newPolygon.geometry.type,
                            coordinates: newPolygon.geometry.coordinates,
                        }
                    }

                } else {
                    polygon = info.polygon;
                }
                set(loadedItemMapAtom, (prev) => {
                    return Object.assign({}, prev, {
                        [info.datasourceId]: {
                            datasourceId: info.datasourceId,
                            polygon: polygon,
                        } as LoadedItemInfo,
                    })
                })
            })

        } catch (e) {
            console.warn('loadItems error', e);
            throw e;
        } finally {
            hideProcessMessage(h);

        }

    }, [callApi, showProcessMessage, hideProcessMessage])
)

    /**
     * 現在の地図表示範囲内に存在するコンテンツをロードする
     */
    const loadingCurrentAreaContents = useRef(false);
    const loadCurrentAreaContents = useCallback(async() => {
        console.log('loadCurrentAreaContents', mapInstanceId);

        if (!map) {
            console.warn('map is undefined', mapInstanceId);
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

    }, [loadItems, map, mapInstanceId]);

    /**
     * 指定範囲のアイテムを更新する
     */
    const updateAreaItems = useAtomCallback(
        useCallback(async(get, set, extent: Extent, dataSourceId: string) => {
            if (!map) {
                console.warn('map is undefined', mapInstanceId);
                return;
            }
            const zoom = map.getZoom();
            if (!zoom) {
                return;
            }
            // TODO:
            // const loadedItemKeys = get(loadedItemKeysAtom);
            const isLoaded = false;
            // const isLoaded = loadedItemKeys.some(key => {
            //     if (key.datasourceId !== dataSourceId) return false;
            //     return checkContaining(key.extent, extent) !== 0;
            // })
            // 未ロード範囲ならば何もしない
            if (!isLoaded) return;

            const apiResult = await callApi(GetItemsAPI, {
                // TODO
                wkt: '',
                zoom,
                dataSourceIds: [dataSourceId],
            });
            const items = apiResult.items;

            const itemMap: ItemsMap = {};
            items.forEach(item => {
                itemMap[item.id.id] = item;
            });
            set(allItemsAtom, (currentItemMap) => {
                const newItemsMap = Object.assign({}, currentItemMap, {
                    [dataSourceId]: itemMap,
                });
                return newItemsMap;
            })
        }, [callApi, map, mapInstanceId])
    )

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
        updateAreaItems,
    }
}
