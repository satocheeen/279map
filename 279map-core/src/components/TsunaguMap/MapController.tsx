import { Extent, ItemDefine, MapKind } from '279map-common';
import { useAtomCallback } from 'jotai/utils';
import React, { useRef, useMemo, useCallback, useContext, useEffect, lazy, Suspense, useState } from 'react';
import { allItemsAtom, loadedItemKeysAtom } from '../../store/item';
import { checkContaining } from '../../util/MapUtility';
import { useSubscribe } from '../../api/useSubscribe';
import { currentMapDefineAtom, currentMapKindAtom, instanceIdAtom } from '../../store/session';
import { atom, useAtom } from 'jotai';
import { useItem } from '../../store/item/useItem';
import { itemDataSourcesAtom } from '../../store/datasource';
import { mapInstanceIdAtom, useMap } from '../map/useMap';
import { dialogTargetAtom, selectedItemIdsAtom } from '../../store/operation';
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
 * - 地図再作成する
 */
function useMapInitializer() {
    // 地図種別が変更されたら、地図に対してsubscribe, unsubscribeする
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const { getSubscriber } = useSubscribe();
    const { removeItems } = useItem();
    const { updateAreaItems } = useMap();
    const [ mapInstanceId ] = useAtom(mapInstanceIdAtom);

    useEffect(() => {
        if (!currentMapKind) return;

        const subscriber = getSubscriber();
        if (!subscriber) return;

        const h1 = subscriber.subscribeMap({mapKind: currentMapKind}, 'mapitem-update', undefined, (payload) => {
            if (payload.type === 'mapitem-update') {
                // 表示中エリアの場合は最新ロードする
                payload.targets.forEach(target => {
                    updateAreaItems(target.extent, target.datasourceId);
                })
            }
        });
        const h2 = subscriber.subscribeMap({mapKind: currentMapKind}, 'mapitem-delete', undefined, (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        return () => {
            if (h1) 
                subscriber.unsubscribe(h1);
            if (h2)
                subscriber.unsubscribe(h2);
        }
    }, [currentMapKind, removeItems, getSubscriber, updateAreaItems, mapInstanceId]);

}

export const initialLoadingAtom = atom(false);
/**
 * アイテムの変更検知して、地図に反映するフック
 */
function useItemUpdater() {
    const { map, fitToDefaultExtent } = useMap();
    const [ itemMap ] = useAtom(allItemsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    // 地図初期化済みの地図種別
    const [ initializedMapKind, setInitializedMapKind ] = useState<MapKind|undefined>();
    const [ , setLoadedItemKeys] = useAtom(loadedItemKeysAtom);
    const [ , setInitialLoading ] = useAtom(initialLoadingAtom);
    const [ currentMapDefine ] = useAtom(currentMapDefineAtom);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useEffect(() => {
        if (!map || !currentMapKind) return;
        if (initializedMapKind ===  currentMapKind) return;

        // 現在のレイヤ、データソースを削除
        map.clearAllLayers();
        
        // 初期レイヤ生成
        map.initialize(currentMapKind, itemDataSources, currentMapDefine?.extent);

        fitToDefaultExtent(false);
        setInitializedMapKind(currentMapKind);
        prevGeoJsonItemsRef.current = [];
        setLoadedItemKeys([]);
        setInitialLoading(true);

    }, [map, currentMapDefine, currentMapKind, initializedMapKind, itemDataSources, fitToDefaultExtent, setLoadedItemKeys, setInitialLoading]);

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
            return before.lastEditedTime !== item.lastEditedTime;   // 更新Item
        })
        map.addFeatures(updateItems)
        .then(() => {
            // 削除
            // 削除アイテム＝prevGeoJsonItemに存在して、geoJsonItemsに存在しないもの
            const currentIds = geoJsonItems.map(item => item.id);
            const deleteItems = prevGeoJsonItemsRef.current.filter(pre => {
                return !currentIds.some(current => isEqualId(current, pre.id));
            });
            deleteItems?.forEach(item => {
                map.removeFeature(item);
            });

        })
        .finally(() => {
            prevGeoJsonItemsRef.current = geoJsonItems.concat();
        });

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
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
    const { map } = useMap();

    useEffect(() => {
        map?.updateLayerVisible(itemDataSources);

    }, [itemDataSources, map]);

}

/**
 * アイテム選択を検知して、詳細ダイアログ表示
 */
function ItemSelectListener() {
    const [ selectedItemIds ] = useAtom(selectedItemIdsAtom);
    const prevSelectedItemIds = usePrevious(selectedItemIds);
    const { disabledContentDialog } = useContext(OwnerContext);
    const [ dialogTarget, setDialogTarget ] = useAtom(dialogTargetAtom);

    if (disabledContentDialog) {
        return null;
    }
    if (!dialogTarget && JSON.stringify(selectedItemIds) !== JSON.stringify(prevSelectedItemIds) && selectedItemIds.length === 1) {
        // １アイテムを選択した場合にダイアログ表示する
        setDialogTarget({
            type: 'item',
            id: selectedItemIds[0]
        });
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
