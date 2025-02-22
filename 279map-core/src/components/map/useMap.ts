import { useCallback, useMemo } from 'react';
import { OlMapWrapper } from '../TsunaguMap/OlMapWrapper';
import { atom, useAtom } from 'jotai';
import { useAtomCallback, atomWithReducer } from 'jotai/utils';
import { currentMapKindAtom, defaultExtentAtom, instanceIdAtom } from '../../store/session';
import { LoadedAreaInfo, LoadedItemKey, allItemsAtom, loadedItemMapAtom, storedItemsAtom } from '../../store/item';
import { itemDataSourcesAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import useMyMedia from '../../util/useMyMedia';
import Feature from "ol/Feature";
import { Geometry } from 'ol/geom';
import { sleep } from '../../util/CommonUtility';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { initialLoadingAtom } from '../TsunaguMap/MapController';
import { geoJsonToTurfPolygon } from '../../util/MapUtility';
import { bboxPolygon, intersect, union, buffer, point, booleanPointInPolygon, bbox, polygon} from '@turf/turf';
import { geojsonToWKT } from '@terraformer/wkt';
import { useItems } from '../../store/item/useItems';
import { GetItemsByIdDocument, GetItemsDocument } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import GeoJSON from 'geojson';
import { Extent } from 'ol/extent';
import { DataId, DatasourceLocationKindType } from '../../types-common/common-types';
import { selectItemIdAtom } from '../../store/operation';
import { ItemInfo, TsunaguMapHandler } from '../../entry';

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
    const [ gqlClient ] = useAtom(clientAtom);

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
            const map = new OlMapWrapper(mapInstanceId, target, isPC ? 'pc' : 'sp', gqlClient);
            console.log('create map', mapInstanceId);

            instansMap.set(mapInstanceId, map);
            return mapInstanceId;
        }, [dispatch, isPC, gqlClient])
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

    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const getLoadedAreaMapKey = useAtomCallback(
        useCallback((get, set, datasourceId: string, zoom: number): LoadedItemKey => {
            const datasources = get(itemDataSourcesAtom);
            // データソースがGPXの場合は、ZoomLv.もkeyとして扱う
            const dsInfo = datasources.find(ds => ds.datasourceId === datasourceId);
            const key: LoadedItemKey = {
                datasourceId,
                zoom: dsInfo?.config.kind === DatasourceLocationKindType.Track ? zoom : undefined,
            }
            return key;
        }, [])        
    )

    /**
     * getitemsの除外対象とするアイテムIDを返す
     */
    const getExcludeItemIds = useAtomCallback(
        useCallback((get, set, datasourceId: string, extent: Extent) => {
            const datasources = get(itemDataSourcesAtom);
            const dsInfo = datasources.find(ds => ds.datasourceId === datasourceId);
            if (dsInfo?.config.kind !== DatasourceLocationKindType.Track) {
                // Track以外は関係なし
                return undefined;
            }
            // 取得済みのアイテムを抽出
            const allItems = get(allItemsAtom);
            const extentPolygon = bboxPolygon(extent as [number,number,number,number]);
            return allItems.filter(item => {
                let hit: boolean = false;
                if (item.geometry.type === 'GeometryCollection') {
                    hit = item.geometry.geometries.some(g => {
                        const polygon = geoJsonToTurfPolygon(g);
                        if (!polygon) return false;
                        const result = intersect(extentPolygon, polygon);
                        return result !== null;
                    })
                }
                return hit;
            }).map(item => item.id);
        }, [])
    )
    /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
    const loadItems = useAtomCallback(
        useCallback(async(get, set, param: { extent: Extent; zoom: number }) => {

            try {
                // 未ロードのデータのみロードする
                // -- zoomは小数点以下は切り捨てる
                const zoom = Math.floor(param.zoom);
                const loadedItemMap = get(loadedItemMapAtom);
                const visibleDataSourceIds = get(visibleDataSourceIdsAtom);

                const extentPolygon = bboxPolygon(param.extent as [number,number,number,number]);

                // ロード対象
                const loadTargets = [] as {datasourceId: string; geometry: GeoJSON.Geometry}[];
                visibleDataSourceIds.forEach((datasourceId) => {
                    const loadedItemMap = get(loadedItemMapAtom);
                    const key = getLoadedAreaMapKey(datasourceId, zoom);
                    const loadedItemInfo = loadedItemMap[JSON.stringify(key)];
                    const loadedPolygon = loadedItemInfo ? geoJsonToTurfPolygon(loadedItemInfo.geometry) : undefined;
                    if (loadedPolygon) {
                        const isContain = (() => {
                            return extentPolygon.geometry.coordinates.every(coords => {
                                return coords.every(point => {
                                    if (loadedPolygon.geometry.type === 'MultiPolygon') {
                                        return loadedPolygon.geometry.coordinates.some(coords => {
                                            const loadedArea = polygon(coords)
                                            const res = booleanPointInPolygon(point, loadedArea);
                                            return res;
                                        });
                                    } else {
                                        const loadedArea = polygon(loadedPolygon.geometry.coordinates);
                                        const res = booleanPointInPolygon(point, loadedArea);
                                        return res;
                                    }
                                })
                            })
    
                        })();
                        console.log('isContain', isContain, loadedPolygon, extentPolygon)
                        if (isContain) {
                            // ロード済み領域の場合はロードしない
                            return;
                        }
                    }
                    let polygon2: LoadedAreaInfo['geometry'] | undefined;
                    polygon2 = {
                        type: 'Polygon',
                        coordinates: extentPolygon.geometry.coordinates
                    }
                    loadTargets.push({
                        datasourceId,
                        geometry: polygon2,
                    });
                });
                console.log('loadTargets', loadTargets)

                const beforeMapKind = get(currentMapKindAtom);
                const apiResults = await Promise.all(loadTargets.map(async(target) => {
                    const wkt = geojsonToWKT(target.geometry);
                    // TrackがズームLv.を切り替えると取得できないので、ひとまずコメントアウト
                    // Extentチェックして、取得済みのExtentは再取得しないようにしているからlastEditedTime, excludeItemIdsはどちらにしろ指定不要かも。
                    // const latestEditedTime = get(latestEditedTimeOfDatasourceAtom)[target.datasourceId];
                    // const excludeItemIds = getExcludeItemIds(target.datasourceId, param.extent);

                    return gqlClient.query(GetItemsDocument, {
                        wkt,
                        zoom,
                        // latestEditedTime,
                        datasourceId: target.datasourceId,
                        // excludeItemIds,
                    }, {
                        requestPolicy: 'network-only',  // 地図切り替えを繰り返した際にキャッシュが使われると、新たに追加・削除したものが反映されないため。
                    });
                }));
                
                // TODO: 地図が切り替えられていたら何もしない
                const afterMapKind = get(currentMapKindAtom);
                if (beforeMapKind !== afterMapKind) {
                    console.log('cancel load items because map change', beforeMapKind);
                    return;
                }
                const hasItem = apiResults.some(apiResult => {
                    const items = apiResult.data?.getItems ?? [];
                    return items.length > 0;
                });
                if (hasItem) {
                    set(storedItemsAtom, (currentItems) => {
                        const newItems = apiResults.reduce((acc, cur) => {
                            const items = cur.data?.getItems.map((i): ItemInfo => {
                                return {
                                    id: i.id,
                                    datasourceId: i.datasourceId,
                                    name: i.name,
                                    geometry: i.geometry,
                                    geoProperties: i.geoProperties,
                                    content: i.content,
                                    lastEditedTime: i.lastEditedTime,
                                    // linkedContents: i.linkedContents,
                                }
                            }) ?? [];
                            return [...acc, ...items];
                        }, [] as ItemInfo[])
                        return [...currentItems, ...newItems];
                    })
                }

                // ロード済みの範囲と併せたものを保管
                const newLoadedItemMap = Object.assign({}, loadedItemMap);
                loadTargets.forEach(info => {
                    const key = getLoadedAreaMapKey(info.datasourceId, zoom);
                    const keyStr = JSON.stringify(key);
                    const currentData = loadedItemMap[keyStr];
                    let polygon: LoadedAreaInfo['geometry'];
                    if (currentData) {
                        const loadedPolygon = geoJsonToTurfPolygon(currentData.geometry);
                        const newLoadedPolygon = geoJsonToTurfPolygon(info.geometry);
                        if (!newLoadedPolygon) return;
                        const newPolygon = loadedPolygon ?
                            union(
                                loadedPolygon,
                                newLoadedPolygon,
                            )
                            : newLoadedPolygon;
                        if (!newPolygon) return;
                        polygon = newPolygon.geometry;

                    } else {
                        polygon = info.geometry;
                    }
                    newLoadedItemMap[keyStr] = {
                        geometry: polygon,
                    }
                })
                set(loadedItemMapAtom, newLoadedItemMap);

            } catch (e) {
                console.warn('loadItems error', e);
                throw e;

            }

        }, [gqlClient, getLoadedAreaMapKey, getExcludeItemIds])
    )

    /**
     * 現在の地図表示範囲内に存在するコンテンツをロードする
     */
    const loadCurrentAreaContents = useAtomCallback(
        useCallback(async(get, set) => {
            console.log('loadCurrentAreaContents', mapInstanceId);

            if (!map) {
                console.warn('map is undefined', mapInstanceId);
                return;
            }

            const zoom = map.getZoom();
            if (!zoom) {
                return;
            }
            const ext = map.getExtent();

            const overlay = get(initialLoadingAtom);
            const h = showProcessMessage({
                overlay, // 初回ロード時はoverlay表示
                spinner: true,
            });
            set(initialLoadingAtom, false);

            try {
                await loadItems({zoom, extent: ext});

            } finally {
                hideProcessMessage(h);

            }

        }, [loadItems, map, mapInstanceId, showProcessMessage, hideProcessMessage])
    )

    const { getItem} = useItems();

    /**
     * 必要に応じて、指定のアイテムを更新する
     */
    const updateItems = useAtomCallback(
        useCallback(async(get, set, targets: {id: DataId; datasourceId: string, wkt?: string}[]) => {
            const loadedItemMap = get(loadedItemMapAtom);
            // 取得する必要のあるものに絞る
            const updateTargets = targets.filter(target => {
                // 取得済みアイテムの場合、取得
                if (getItem(target.id)) return true;

                // 取得済み範囲の場合、取得
                // XXX: ここの判定がうまく行かないことがあるので、とりあえずすべて再取得する形で暫定対処
                return true;
                // const key = getLoadedAreaMapKey(target.datasourceId, 0);
                // const loadedAreaInfo = loadedItemMap[JSON.stringify(key)];
                // if (!loadedAreaInfo) {
                //     console.log('loadedAreaInfo undefined', loadedItemMap);
                //     return false;
                // }
                // const loadedPolygon = geoJsonToTurfPolygon(loadedAreaInfo.geometry);
                // if (!loadedPolygon) {
                //     console.log('loadedPolygon undefined');
                //     return false;
                // }

                // if (!target.wkt) return true;
                
                // const geoJson = wktToGeoJSON(target.wkt);
                // const polygon = geoJsonToTurfPolygon(geoJson);
                // if (!polygon) {
                //     console.log('polygon undefined');
                //     return false;
                // }
                // const isContain =  intersect(loadedPolygon, polygon) !== null;
                // return isContain;

            }).map((target): DataId => {
                return target.id;
            });

            if (updateTargets.length === 0) return;

            const apiResult = await gqlClient.query(GetItemsByIdDocument, {
                targets: updateTargets,
            }, { requestPolicy: 'network-only' });
            const items = apiResult.data?.getItemsById ?? [];

            set(storedItemsAtom, (currentItems) => {
                // 既に存在するものは置き換え、存在しないものは追加
                const newItems = currentItems.map((item): ItemInfo => {
                    const newItem = items.find(i => i.id === item.id);
                    if (newItem) {
                        return {
                            id: newItem.id,
                            datasourceId: newItem.datasourceId,
                            geometry: newItem.geometry,
                            geoProperties: newItem.geoProperties,
                            name: newItem.name,
                            content: newItem.content,
                            lastEditedTime: newItem.lastEditedTime,
                            // linkedContents: newItem.linkedContents,
                        }
                    } else {
                        return item;
                    }
                });
                const addItems = items
                                    .filter(item => !currentItems.some(ci => ci.id === item.id))
                                    .map((item): ItemInfo => {
                                        return {
                                            id: item.id,
                                            datasourceId: item.datasourceId,
                                            geometry: item.geometry,
                                            geoProperties: item.geoProperties,
                                            name: item.name,
                                            content: item.content,
                                            lastEditedTime: item.lastEditedTime,
                                            // linkedContents: item.linkedContents,
                                        }
                                    })

                return [...newItems, ...addItems];
            })

        }, [getItem, gqlClient, getLoadedAreaMapKey])
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
        useCallback(async(get, set, param: Parameters<TsunaguMapHandler['focusItem']>[0]) => {
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
            const featureExtent = itemFeature.getGeometry()?.getExtent();
            if (!featureExtent) return;

            const items = get(allItemsAtom);
            const ext = function() {
                if (!param.zoom) {
                    return featureExtent;
                }
                // ズームする場合は、周囲のポイントを加味して、引き過ぎず、ズームしすぎず、のエクステントにする。
                const extentPolygon = bboxPolygon(featureExtent as [number, number, number, number]);
                
                // 初期バッファ距離 (キロメートル)
                let bufferDistance = 30; // 初期の距離をキロメートル単位で設定
                let exclusiveExtent = featureExtent;
                let isExistOtherPoint = true;

                do {
                    // Turfでバッファを生成（距離はキロメートル単位）
                    const buffered = buffer(extentPolygon, bufferDistance, { units: 'kilometers' });
                    if (!buffered) {
                        break;
                    }
                    exclusiveExtent = bbox(buffered); // 最終的なバッファのエクステントを取得

                    // 他のポイントがバッファ内に存在しないか確認
                    isExistOtherPoint = items.some(item => {
                        if (item.geometry.type !== 'Point') return false;
                        if (item.id === param.itemId) return false;
                        
                        const otherPoint = point(item.geometry.coordinates);
                        return booleanPointInPolygon(otherPoint, buffered);
                    });

                    // 他のポイントが含まれている場合、バッファ距離を縮小
                    if (isExistOtherPoint) {
                        bufferDistance -= 0.05; // バッファ距離を少しずつ縮小 (キロメートル単位)
                    }
                }while (isExistOtherPoint && bufferDistance > 0.01) // 最小バッファ距離を設定

                return exclusiveExtent;
            }();
            await map.fit(ext, {
                animation: true,
                zoom: param.zoom,
            });
            if (param.select) {
                set(selectItemIdAtom, param.itemId);
            }
    
        }, [map])
    )
 
    return {
        createMapInstance,
        destroyMapInstance,
        map,
        loadCurrentAreaContents,
        fitToDefaultExtent,
        focusItem,
        updateItems,
    }
}
