import React, { useRef, useMemo, useContext, useEffect, useState } from 'react';
import { allItemsAtom, loadedItemMapAtom, storedItemsAtom } from '../../store/item';
import { currentMapDefineAtom, currentMapKindAtom, isWorldMapAtom } from '../../store/session';
import { atom, useAtom } from 'jotai';
import { useItems } from '../../store/item/useItems';
import { useMap } from '../map/useMap';
import { OwnerContext } from './TsunaguMap';
import { usePrevious } from '../../util/usePrevious';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import usePointStyle from '../map/usePointStyle';
import useTopographyStyleWithState from '../map/useTopographyStyleWithState';
import useTrackStyle from '../map/useTrackStyle';
import { filteredItemIdListAtom } from '../../store/filter';
import VectorSource from 'ol/source/Vector';
import useMyMedia from '../../util/useMyMedia';
import { useWatch } from '../../util/useWatch2';
import { CategoryUpdateInTheMapDocument, DataDeleteInTheMapDocument, DataInsertInTheMapDocument, DataUpdateInTheMapDocument, MapInfoUpdateDocument } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import { ItemInfo } from '../../types/types';
import { selectItemIdAtom } from '../../store/operation';
import { dataSourceVisibleAtom, itemDataSourcesAtom } from '../../store/datasource';
import { UpdateLayerVisibleParam } from './OlMapWrapper';
import { MapKind } from '../../types-common/common-types';
import { categoriesVersionAtom } from '../../store/category';

/**
 * Jotaiや呼び出し元から渡されたpropsの変更検知して、地図に対して特定のイベントを実行するコンポーネントもどき
 * @returns 
 */
export default function MapController() {
    useMapInitializer();
    useItemUpdater();
    useMapStyleUpdater();
    useLayerVisibleChanger();
    useFocusFilteredArea();
    useDeviceListener();

    return (
        <>
            {/* <ItemSelectListener /> */}
        </>
    )
}

/**
 * 地図種別の変更検知して、
 * - 地図に対してsubscribe, unsubscribeする
 */
function useMapInitializer() {
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const { removeItems } = useItems();
    const { updateItems } = useMap();

    const [ urqlClient ] = useAtom(clientAtom);
    const { mapId } = useContext(OwnerContext);
    const [, updateCategoriesVersion ] = useAtom(categoriesVersionAtom);

    // 地図の接続完了したら、地図情報に対するsubscribe開始する
    useEffect(() => {
        const h = urqlClient.subscription(MapInfoUpdateDocument, { mapId }).subscribe((val) => {
            if (val.data?.mapInfoUpdate) {
                // TODO: 地図定義再取得
                // dispatchMapDefine();
            }
        })

        return () => {
            h.unsubscribe();
        }

    }, [urqlClient, mapId]);

    // 地図種別が変更されたら、地図に対してsubscribe, unsubscribeする
    useEffect(() => {
        if (!currentMapKind) return;
        console.log('start subscribe');

        const h1 = urqlClient.subscription(DataInsertInTheMapDocument, { mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.dataInsertInTheMap;
            console.log('subscribe dataInsertInTheMap', targets);
            const items = targets?.filter(t => t.hasItem) ?? [];
            if (items.length > 0) {
                updateItems(items.map(t => {
                    return {
                        datasourceId: t.datasourceId,
                        id: t.id,
                        wkt: t.wkt ?? undefined,
                    }
                }));
            }
        });

        const h2 = urqlClient.subscription(DataUpdateInTheMapDocument, { mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.dataUpdateInTheMap;
            console.log('subscribe dataUpdateInTheMap', targets);
            const items = targets?.filter(t => t.hasItem) ?? [];
            if (items.length > 0) {
                updateItems(items.map(t => {
                    return {
                        datasourceId: t.datasourceId,
                        id: t.id,
                        wkt: t.wkt ?? undefined,
                    }
                }));
            }
        })

        const h3 = urqlClient.subscription(DataDeleteInTheMapDocument, {mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.dataDeleteInTheMap;
            console.log('subscribe dataDeleteInTheMap', targets);
            if (targets) {
                // アイテム削除
                removeItems(targets);
            }
        })
        
        const h4 = urqlClient.subscription(CategoryUpdateInTheMapDocument, {mapId, mapKind: currentMapKind }).subscribe((val) => {
            console.log('subscribe categoryUpdateInTheMap');
            // カテゴリ更新
            updateCategoriesVersion();
        })

        return () => {
            h1.unsubscribe();
            h2.unsubscribe();
            h3.unsubscribe();
            h4.unsubscribe();
        }

    }, [urqlClient, currentMapKind, mapId, updateItems, removeItems, updateCategoriesVersion])

}

export const initialLoadingAtom = atom(false);
/**
 * アイテムの変更検知して、地図に反映するフック
 * - 地図種別が切り替わったら、アイテム情報をリセットして地図再作成する
 * - アイテムの変更を検知したら、地図に反映する
 */
function useItemUpdater() {
    const { map, fitToDefaultExtent } = useMap();
    const [ , setStoredItems ] = useAtom(storedItemsAtom);
    const [ allItems ] = useAtom(allItemsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const [ itemDatasources ] = useAtom(itemDataSourcesAtom);
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    // 地図初期化済みの地図種別
    const [ initializedMapKind, setInitializedMapKind ] = useState<MapKind|undefined>();
    const [ , setLoadedItemMap] = useAtom(loadedItemMapAtom);
    const [ , setInitialLoading ] = useAtom(initialLoadingAtom);
    const [ currentMapDefine ] = useAtom(currentMapDefineAtom);
    const [ , setSelectItemId ] = useAtom(selectItemIdAtom);
    const [ isWorldMap ] = useAtom(isWorldMapAtom);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useWatch(currentMapKind, () => {
        if (!map || !currentMapKind) return;
        if (initializedMapKind ===  currentMapKind) return;

        setStoredItems([]);

        // 現在のレイヤ、データソースを削除
        map.clearAllLayers();
        
        // 初期レイヤ生成
        map.initialize({
            mapKind: currentMapKind,
            itemDataSources: itemDatasources,
            fitExtent: currentMapDefine?.extent,
            isWorldMap,
        });

        setSelectItemId(null);
        fitToDefaultExtent(false);
        setInitializedMapKind(currentMapKind);
        prevGeoJsonItemsRef.current = [];
        setLoadedItemMap({});
        setInitialLoading(true);
    })

    /**
     * アイテムFeatureを地図に反映する
     */
    const geoJsonItems = useMemo(() => {
        return allItems;
    }, [allItems]);

    // 追加済みアイテム
    const prevGeoJsonItemsRef = useRef<ItemInfo[]>([]);

    useEffect(() => {
        if (!map || !initializedMapKind) return;
        if (initializedMapKind !== currentMapKind) return;

        // 追加、更新
        // TODO: OlMapWrapperに追加有無判断は任せる
        const updateItems = geoJsonItems.filter(item => {
            const before = prevGeoJsonItemsRef.current.find(pre => pre.id === item.id);
            if (!before) return true;   // 追加Item
            return JSON.stringify(before) !== JSON.stringify(item);   // 更新Item
        })
        map.addFeatures(updateItems);
        // 削除
        // 削除アイテム＝prevGeoJsonItemに存在して、geoJsonItemsに存在しないもの
        const currentIds = geoJsonItems.map(item => item.id);
        const deleteItems = prevGeoJsonItemsRef.current.filter(pre => {
            return !currentIds.some(current => current === pre.id);
        });
        deleteItems.forEach(item => {
            map.removeFeature(item);
        });

        prevGeoJsonItemsRef.current = geoJsonItems.concat();

    }, [geoJsonItems, map, hideProcessMessage, showProcessMessage, initializedMapKind, currentMapKind]);

}

/**
 * スタイル定義の変更検知して、地図にスタイル設定するフック
 */
function useMapStyleUpdater() {
    const { map } = useMap();

    // スタイル設定
    // -- コンテンツ（建物・ポイント）レイヤ
    const { pointStyleFunction } = usePointStyle();
    useEffect(() => {
        if (!map) return;

        map.setPointLayerStyle(pointStyleFunction);
    }, [map, pointStyleFunction])

    // -- コンテンツ（地形）レイヤ
    const { topographyStyleFunction } = useTopographyStyleWithState();
    useEffect(() => {
        if (!map) return;

        map.setTopographyLayerStyle(topographyStyleFunction);

    }, [map, topographyStyleFunction])

    // -- 軌跡レイヤ
    const { trackStyleFunction } = useTrackStyle();
    useEffect(() => {
        if (!map) return;

        map.setTrackLayerStyle(trackStyleFunction);

    }, [map, trackStyleFunction])

}

/**
 * データソースの表示情報変更検知して、レイヤの表示・非表示切り替え
 */
function useLayerVisibleChanger() {
    const [ dsVisibleInfo ] = useAtom(dataSourceVisibleAtom);
    const { map } = useMap();

    useWatch(dsVisibleInfo, (oldVal, newVal) => {
        // 表示情報に変更のあったレイヤを判定
        const changes: UpdateLayerVisibleParam = Object.entries(newVal).filter(([dsId, visible]) => {
            const oldVisible = oldVal[dsId];
            if (!oldVisible) return true;
            return oldVisible !== visible;
        }).map(([dsId, visible]) => {
            return {
                datasourceId: dsId,
                visible,
            }
        });
        map?.updateLayerVisible(changes);
    })

}

/**
 * フィルタ時にフィルタ対象がExtentに入るようにする
 */
function useFocusFilteredArea() {
    const { map, fitToDefaultExtent } = useMap();
    const [filteredItemIdList] = useAtom(filteredItemIdListAtom);
    const prevFilteredItemIdList = usePrevious(filteredItemIdList);
    
    useEffect(() => {
        if (!map) return;
        if (!filteredItemIdList || filteredItemIdList.length === 0) {
            // if (prevFilteredItemIdList && prevFilteredItemIdList.length > 0) {
            //     // フィルタ解除された場合、全体fit
            //     fitToDefaultExtent(true);
            // }
            return;
        }
        const source = new VectorSource();
        filteredItemIdList.forEach(itemId => {
            const feature = map.getFeatureById(itemId);
            if (feature) {
                // Cluster化している場合は、既にsourceに追加されている可能性があるので、
                // 追加済みでない場合のみ追加
                if (!source.hasFeature(feature)) {
                    source.addFeature(feature);
                }
            } else {
                console.warn('feature not found.', itemId);
            }
        });
        if (source.getFeatures().length === 0) {
            return;
        }
        const ext = source.getExtent();
        map.fit(ext, {
            animation: true,
        });
        source.dispose();

    }, [filteredItemIdList, prevFilteredItemIdList, map, fitToDefaultExtent]);
}

/**
 * デバイスの変更検知して地図に反映
 */
function useDeviceListener() {
    const { map } = useMap();
    const { isPC } = useMyMedia();

    useEffect(() => {
        map?.changeDevice(isPC ? 'pc' : 'sp');
    }, [isPC, map]);

}

/**
 * 呼び出し元から渡される一時ジオメトリを描画する
 */
// function useTemporaryFeature() {
//     const { map } = useMap();
//     const { temporaryFeatures } = useContext(OwnerContext);
 
//     useWatch(temporaryFeatures, () => {
//         if (!map) return;
//         const source = map.getDataSourceLayers(TemporaryPointLayerDatasourceId)[0]?.getSource();
//         if (!source) return;
        
//         source.clear();
//         if (!temporaryFeatures) return;
//         const features = temporaryFeatures.map((tf): ItemInfo => {
//             return {
//                 id: {
//                     dataSourceId: TemporaryPointLayerDatasourceId,
//                     id: tf.id,
//                 },
//                 geometry: tf.geoJson as GeoJSON.Geometry,
//                 contents: [],
//                 geoProperties: {
//                     featureType: FeatureType.STRUCTURE,
//                 },
//                 hasContents: false,
//                 hasImageContentId: [],
//                 lastEditedTime: '',
//                 name: '',
//             }
//         })
//         map.addFeatures(features);
//     })
// }