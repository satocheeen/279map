import { MapKind } from '279map-common';
import React, { useRef, useMemo, useContext, useEffect, lazy, Suspense, useState } from 'react';
import { allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { useSubscribe } from '../../api/useSubscribe';
import { currentMapDefineAtom, currentMapKindAtom, mapDefineReducerAtom } from '../../store/session';
import { atom, useAtom } from 'jotai';
import { useItems } from '../../store/item/useItems';
import { itemDataSourceGroupsAtom } from '../../store/datasource';
import { useMap } from '../map/useMap';
import { dialogTargetAtom } from '../../store/operation';
import { OwnerContext } from './TsunaguMap';
import { usePrevious } from '../../util/usePrevious';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { isEqualId } from '../../util/dataUtility';
import usePointStyle from '../map/usePointStyle';
import useFilteredTopographyStyle from '../map/useFilteredTopographyStyle';
import useTrackStyle from '../map/useTrackStyle';
import { filteredItemIdListAtom } from '../../store/filter';
import VectorSource from 'ol/source/Vector';
import useMyMedia from '../../util/useMyMedia';
import { useWatch } from '../../util/useWatch2';
import { ItemDefine, ItemDeleteDocument, ItemInsertDocument, ItemUpdateDocument, TestDocument } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';

const ContentsModal = lazy(() => import('../contents/ContentsModal'));

/**
 * Jotaiの変更検知して、地図に対して特定のイベントを実行するコンポーネントもどき
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
            <ItemSelectListener />
        </>
    )
}

/**
 * 地図種別の変更検知して、
 * - 地図に対してsubscribe, unsubscribeする
 */
function useMapInitializer() {
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const { getSubscriber } = useSubscribe();
    const { removeItems } = useItems();
    const { updateItems } = useMap();

    // 地図の接続完了したら、地図情報に対するsubscribe開始する
    const [, dispatchMapDefine] = useAtom(mapDefineReducerAtom);
    useEffect(() => {
        const subscriber = getSubscriber();
        if (!subscriber || !currentMapKind) return;

        const h = subscriber.subscribeMap({mapKind: currentMapKind}, 'mapinfo-update', undefined, (payload) => {
            dispatchMapDefine();
        });

        return () => {
            if (h) {
                subscriber.unsubscribe(h);
            }
        }

    }, [getSubscriber, dispatchMapDefine, currentMapKind]);

    const [ urqlClient ] = useAtom(clientAtom);
    const { mapId } = useContext(OwnerContext);

    // 地図種別が変更されたら、地図に対してsubscribe, unsubscribeする
    useEffect(() => {
        if (!currentMapKind) return;
        console.log('start subscribe');
        urqlClient.subscription(TestDocument, {}).subscribe((val) => {
            console.log('subscribe test', val);
        })

        const h1 = urqlClient.subscription(ItemInsertDocument, { mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.itemInsert;
            if (targets) {
                // 表示中エリアの場合は最新ロードする
                updateItems(targets);
            }
        });

        const h2 = urqlClient.subscription(ItemUpdateDocument, { mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.itemUpdate;
            if (targets) {
                // 表示中エリアの場合は最新ロードする
                updateItems(targets);
            }
        })

        const h3 = urqlClient.subscription(ItemDeleteDocument, {mapId, mapKind: currentMapKind }).subscribe((val) => {
            const targets = val.data?.itemDelete;
            if (targets) {
                // アイテム削除
                removeItems(targets);
            }
        })
        
        return () => {
            h1.unsubscribe();
            h2.unsubscribe();
            h3.unsubscribe();
        }

    }, [urqlClient, currentMapKind, mapId, updateItems, removeItems])

}

export const initialLoadingAtom = atom(false);
/**
 * アイテムの変更検知して、地図に反映するフック
 * - 地図種別が切り替わったら、アイテム情報をリセットして地図再作成する
 * - アイテムの変更を検知したら、地図に反映する
 */
function useItemUpdater() {
    const { map, fitToDefaultExtent } = useMap();
    const [ itemMap, setItemMap ] = useAtom(allItemsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const [ itemDatasourceGroups ] = useAtom(itemDataSourceGroupsAtom);
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    // 地図初期化済みの地図種別
    const [ initializedMapKind, setInitializedMapKind ] = useState<MapKind|undefined>();
    const [ , setLoadedItemMap] = useAtom(loadedItemMapAtom);
    const [ , setInitialLoading ] = useAtom(initialLoadingAtom);
    const [ currentMapDefine ] = useAtom(currentMapDefineAtom);
    const [ , setDialogTarget ] = useAtom(dialogTargetAtom);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useWatch(currentMapKind, () => {
        if (!map || !currentMapKind) return;
        if (initializedMapKind ===  currentMapKind) return;

        setItemMap({});

        // 現在のレイヤ、データソースを削除
        map.clearAllLayers();
        
        // 初期レイヤ生成
        map.initialize(currentMapKind, itemDatasourceGroups, currentMapDefine?.extent);

        setDialogTarget(undefined);
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
        return Object.values(itemMap).reduce((acc, cur) => {
            return acc.concat(Object.values(cur));
        }, [] as ItemDefine[]);
    }, [itemMap]);
    // 追加済みアイテム
    const prevGeoJsonItemsRef = useRef<ItemDefine[]>([]);

    useEffect(() => {
        if (!map || !initializedMapKind) return;
        if (initializedMapKind !== currentMapKind) return;

        // 追加、更新
        // TODO: OlMapWrapperに追加有無判断は任せる
        const updateItems = geoJsonItems.filter(item => {
            const before = prevGeoJsonItemsRef.current.find(pre => isEqualId(pre.id, item.id));
            if (!before) return true;   // 追加Item
            return JSON.stringify(before) !== JSON.stringify(item);   // 更新Item
        })
        map.addFeatures(updateItems);
        // 削除
        // 削除アイテム＝prevGeoJsonItemに存在して、geoJsonItemsに存在しないもの
        const currentIds = geoJsonItems.map(item => item.id);
        const deleteItems = prevGeoJsonItemsRef.current.filter(pre => {
            return !currentIds.some(current => isEqualId(current, pre.id));
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
    const { topographyStyleFunction } = useFilteredTopographyStyle();
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
 * データソース情報の変更検知して、レイヤの表示・非表示切り替え
 */
function useLayerVisibleChanger() {
    const [ itemDatasources ] = useAtom(itemDataSourceGroupsAtom);
    const { map } = useMap();

    useEffect(() => {
        map?.updateLayerVisible(itemDatasources);

    }, [itemDatasources, map]);

}

/**
 * アイテム選択を検知して、詳細ダイアログ表示
 */
function ItemSelectListener() {
    const { disabledContentDialog } = useContext(OwnerContext);
    const [ dialogTarget, setDialogTarget ] = useAtom(dialogTargetAtom);

    if (disabledContentDialog) {
        return null;
    }

    if (!dialogTarget) {
        return null;
    }
    return (
        <Suspense>
            <ContentsModal {...dialogTarget} onClose={() => setDialogTarget(undefined)} />
        </Suspense>
    )

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
            if (prevFilteredItemIdList && prevFilteredItemIdList.length > 0) {
                // フィルタ解除された場合、全体fit
                fitToDefaultExtent(true);
            }
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
