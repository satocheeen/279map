import { useCallback, useMemo } from 'react';
import { OlMapWrapper } from '../TsunaguMap/OlMapWrapper';
import { atom, useAtom } from 'jotai';
import { useAtomCallback, atomWithReducer } from 'jotai/utils';
import { currentMapKindAtom, defaultExtentAtom, instanceIdAtom, mapIdAtom } from '../../store/session';
import { GetGrib2API, GetItemsAPI } from 'tsunagumap-api';
import { LoadedAreaInfo, LoadedItemKey, allGridMapAtom, allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { DataId, Extent } from '279map-common';
import { dataSourcesAtom, visibleDataSourcesAtom } from '../../store/datasource';
import useMyMedia from '../../util/useMyMedia';
import { selectedItemIdAtom } from '../../store/operation';
import Feature from "ol/Feature";
import { Geometry } from 'ol/geom';
import { sleep } from '../../util/CommonUtility';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useApi } from '../../api/useApi';
import { initialLoadingAtom } from '../TsunaguMap/MapController';
import { geoJsonToTurfPolygon } from '../../util/MapUtility';
import { bboxPolygon, intersect, union, mask } from '@turf/turf';
import { geojsonToWKT, wktToGeoJSON } from '@terraformer/wkt';

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
    const { callApi } = useApi();

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
            const map = new OlMapWrapper(mapInstanceId, target, isPC ? 'pc' : 'sp', callApi);
            console.log('create map', mapInstanceId);

            instansMap.set(mapInstanceId, map);
            return mapInstanceId;
        }, [dispatch, isPC, callApi])
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
            const datasources = get(dataSourcesAtom);
            // データソースがGPXの場合は、ZoomLv.もkeyとして扱う
            const dsInfo = datasources.find(ds => ds.dataSourceId === datasourceId);
            const key: LoadedItemKey = {
                datasourceId,
                zoom: dsInfo?.itemContents.Track ? zoom : undefined,
            }
            return key;
        }, [])        
    )

    /**
     * getitemsの除外対象とするアイテムIDを返す
     */
    const getExcludeItemIds = useAtomCallback(
        useCallback((get, set, datasourceId: string, extent: Extent) => {
            const datasources = get(dataSourcesAtom);
            const dsInfo = datasources.find(ds => ds.dataSourceId === datasourceId);
            if (!dsInfo?.itemContents.Track) {
                // Track以外は関係なし
                return undefined;
            }
            // 取得済みのアイテムを抽出
            const allItems = get(allItemsAtom);
            const itemMap = allItems[datasourceId];
            if (!itemMap) {
                return undefined;
            }
            const extentPolygon = bboxPolygon(extent as [number,number,number,number]);
            return Object.values(itemMap).filter(item => {
                let hit: boolean = false;
                if (item.geoJson.type === 'GeometryCollection') {
                    hit = item.geoJson.geometries.some(g => {
                        const polygon = geoJsonToTurfPolygon(g);
                        if (!polygon) return false;
                        const result = intersect(extentPolygon, polygon);
                        return result !== null;
                    })
                }
                return hit;
            }).map(item => item.id.id);
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
                const visibleDataSources = get(visibleDataSourcesAtom);

                const extentPolygon = bboxPolygon(param.extent as [number,number,number,number]);

                // ロード対象
                type LoadTargetForItem = {
                    type: 'item';
                    datasourceId: string;
                    geometry: GeoJSON.Geometry
                } 
                type LoadTargetForGrib2 = {
                    type: 'grib2';
                    datasourceId: string;
                    geometry: GeoJSON.Geometry
                }
                const loadTargetsForItem = [] as LoadTargetForItem[];
                const loadTargetsForGrib2 = [] as LoadTargetForGrib2[];
                visibleDataSources.forEach((datasource) => {
                    const loadedItemMap = get(loadedItemMapAtom);
                    const key = getLoadedAreaMapKey(datasource.dataSourceId, zoom);
                    const loadedItemInfo = loadedItemMap[JSON.stringify(key)];
                    const loadedPolygon = loadedItemInfo ? geoJsonToTurfPolygon(loadedItemInfo.geometry) : undefined;
                    let polygon: LoadedAreaInfo['geometry'] | undefined;
                    if (loadedPolygon) {
                        // @ts-ignore 第1引数がなぜかTypeScript Errorになるので
                        const p = mask(loadedPolygon, extentPolygon)
                        polygon = {
                            type: 'Polygon',
                            coordinates: p.geometry.coordinates,
                        }
                    }
                    if (!polygon) {
                        polygon = {
                            type: 'Polygon',
                            coordinates: extentPolygon.geometry.coordinates
                        }
                    }

                    if (datasource.itemContents.Grib2) {
                        loadTargetsForGrib2.push({
                            type: 'grib2',
                            datasourceId: datasource.dataSourceId,
                            geometry: polygon,
                        })
                    } else {
                        loadTargetsForItem.push({
                            type: 'item',
                            datasourceId: datasource.dataSourceId,
                            geometry: polygon,
                        })
                    }
                });

                const beforeMapId = get(mapIdAtom);
                const beforeMapKind = get(currentMapKindAtom);
                const apiResults = await Promise.all(loadTargetsForItem.map((target) => {
                    const wkt = geojsonToWKT(target.geometry);
                    const excludeItemIds = getExcludeItemIds(target.datasourceId, param.extent);
                    return callApi(GetItemsAPI, {
                        wkt,
                        zoom,
                        dataSourceId: target.datasourceId,
                        excludeItemIds,
                    });
                }));
                const grib2ApiResults = await Promise.all(loadTargetsForGrib2.map((target) => {
                    const wkt = geojsonToWKT(target.geometry);
                    return callApi(GetGrib2API, {
                        dataSourceId: target.datasourceId,
                        wkt,
                    }).then(result => {
                        return {
                            target,
                            result,
                        }
                    })
                }))
                
                // TODO: 地図が切り替えられていたら何もしない
                const afterMapId = get(mapIdAtom);
                const afterMapKind = get(currentMapKindAtom);
                if (beforeMapId !== afterMapId || beforeMapKind !== afterMapKind) {
                    console.log('cancel load items because map change', beforeMapId, beforeMapKind);
                    return;
                }
                set(allItemsAtom, (currentItemMap) => {
                    const newItemsMap = structuredClone(currentItemMap);
                    apiResults.forEach(apiResult => {
                        const items = apiResult.items;
                        items.forEach(item => {
                            newItemsMap[item.id.dataSourceId] ??= {};
                            newItemsMap[item.id.dataSourceId][item.id.id] = item;
                        })
                    })
                    return newItemsMap;
                });
                set(allGridMapAtom, (currentGrib2Map) => {
                    const newMap = structuredClone(currentGrib2Map);
                    grib2ApiResults.forEach(apiResult => {
                        if (!newMap[apiResult.target.datasourceId]) {
                            newMap[apiResult.target.datasourceId] = [];
                        }
                        // TODO: 必要に応じてマージ
                        newMap[apiResult.target.datasourceId].push(apiResult.result);
                    })
                    return newMap;
                })

                // ロード済みの範囲と併せたものを保管
                const newLoadedItemMap = Object.assign({}, loadedItemMap);
                loadTargetsForItem.forEach(info => {
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

        }, [callApi, getLoadedAreaMapKey, getExcludeItemIds])
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

    /**
     * 指定範囲のアイテムを更新する
     */
    const updateAreaItems = useAtomCallback(
        useCallback(async(get, set, wkt: string, datasourceId: string) => {
            if (!map) {
                console.warn('map is undefined', mapInstanceId);
                return;
            }
            const zoom = map.getZoom();
            if (!zoom) {
                return;
            }
            // 取得済み範囲と交差する領域についてupdate
            const loadedItemMap = get(loadedItemMapAtom);
            const key: LoadedItemKey = {
                datasourceId,
            }
            const loadedItem = loadedItemMap[JSON.stringify(key)];
            if (!loadedItem) {
                return;
            }
            const loadedPolygon = geoJsonToTurfPolygon(loadedItem.geometry);
            if (!loadedPolygon) {
                console.warn('loaded polygon can not analyze', loadedItem.geometry);
                return;
            }
            const geoJson = wktToGeoJSON(wkt);
            const polygon = geoJsonToTurfPolygon(geoJson);
            if (!polygon) {
                console.warn('wkt is not polygon', wkt, geoJson);
                return;
            }
            const intersectPolygon = intersect(loadedPolygon, polygon);
            if (!intersectPolygon) {
                // 未ロードエリアの場合、何もしない
                return;
            }
            const updateArea = geojsonToWKT(intersectPolygon.geometry);

            const apiResult = await callApi(GetItemsAPI, {
                wkt: updateArea,
                zoom,
                dataSourceId: datasourceId,
            });
            const items = apiResult.items;

            set(allItemsAtom, (currentItemMap) => {
                const newItemsMap = structuredClone(currentItemMap);
                items.forEach(item => {
                    newItemsMap[datasourceId][item.id.id] = item;
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
    
            set(selectedItemIdAtom, param.itemId);
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
