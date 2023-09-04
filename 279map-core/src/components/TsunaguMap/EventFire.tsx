import { Extent, ItemDefine } from '279map-common';
import { useAtomCallback } from 'jotai/utils';
import React, { useMemo, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { allItemsAtom, initialItemLoadedAtom, loadedItemKeysAtom } from '../../store/item';
import { checkContaining } from '../../util/MapUtility';
import { useSubscribe } from '../../api/useSubscribe';
import { currentMapKindAtom } from '../../store/session';
import { useAtom } from 'jotai';
import { useItem } from '../../store/item/useItem';
import { doCommand } from '../../util/Commander';
import { itemDataSourcesAtom } from '../../store/datasource';
import { useMap } from '../map/useMap';
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
 * Jotaiの変更検知して、特定のイベントを実行するコンポーネントもどき
 * @returns 
 */
export default function EventFire() {
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
    const clearLoadedArea = useAtomCallback(
        useCallback((get, set, targets: {datasourceId: string, extent: Extent}[]) => {
            set(loadedItemKeysAtom, (current) => {
                return current.filter(cur => {
                    // ヒットしないもののみを残す
                    return targets.some(target => {
                        if (target.datasourceId !== cur.datasourceId) {
                            return false;
                        }
                        if (checkContaining(target.extent, cur.extent) === 0) {
                            return false;
                        }
                        return true;
                    })
                });
            });

        }, [])
    )

    // 地図種別が変更されたら、地図に対してsubscribe, unsubscribeする
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const { subscribeMap, unsubscribeMap } = useSubscribe();
    const { removeItems } = useItem();
    const { map, fitToDefaultExtent, loadCurrentAreaContents } = useMap();

    useEffect(() => {
        if (!currentMapKind) return;

        subscribeMap('mapitem-update', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-update') {
                // 指定のエクステントをロード済み対象から除去する
                clearLoadedArea(payload.targets);

                loadCurrentAreaContents();
            }
        });
        subscribeMap('mapitem-delete', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        return () => {
            unsubscribeMap('mapitem-update', currentMapKind, undefined);
            unsubscribeMap('mapitem-delete', currentMapKind, undefined);
        }
    }, [currentMapKind, removeItems, subscribeMap, unsubscribeMap, clearLoadedArea, loadCurrentAreaContents]);

    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
    const prevMapKind = usePrevious(currentMapKind);
    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useEffect(() => {
        if (!map || !currentMapKind) return;
        if (currentMapKind === prevMapKind) return;

        // 現在のレイヤ、データソースを削除
        map.clearAllLayers();
        
        // 初期レイヤ生成
        map.initialize(currentMapKind, itemDataSources);

        fitToDefaultExtent(false);
        loadCurrentAreaContents();

    }, [map, currentMapKind, prevMapKind, itemDataSources, loadCurrentAreaContents, fitToDefaultExtent]);
}

/**
 * アイテムの変更検知して、地図に反映するフック
 */
function useItemUpdater() {
    const { map } = useMap();
    const [ itemMap ] = useAtom(allItemsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    /**
     * アイテムFeatureを地図に反映する
     */
    const geoJsonItems = useMemo(() => {
        return Object.values(itemMap).reduce((acc, cur) => {
            return acc.concat(Object.values(cur));
        }, [] as ItemDefine[]);
    }, [itemMap]);
    const prevGeoJsonItems = usePrevious(geoJsonItems);
    const [initialItemLoaded] = useAtom(initialItemLoadedAtom);

    useEffect(() => {
        if (!map) return;

        // 追加、更新
        const progressH = showProcessMessage({
            overlay: !initialItemLoaded,    // 初回ロード時はオーバーレイ
            spinner: true,
        });
        // TODO: OlMapWrapperに追加有無判断は任せる
        const updateItems = geoJsonItems.filter(item => {
            const before = prevGeoJsonItems?.find(pre => isEqualId(pre.id, item.id));
            if (!before) return true;   // 追加Item
            return before.lastEditedTime !== item.lastEditedTime;   // 更新Item
        })
        map.addFeatures(updateItems)
        .then(() => {
            // 削除
            // 削除アイテム＝prevGeoJsonItemに存在して、geoJsonItemsに存在しないもの
            const currentIds = geoJsonItems.map(item => item.id);
            const deleteItems = prevGeoJsonItems?.filter(pre => {
                return !currentIds.some(current => isEqualId(current, pre.id));
            });
            deleteItems?.forEach(item => {
                map.removeFeature(item);
            });

        })
        .finally(() => {
            hideProcessMessage(progressH);
        });

    }, [geoJsonItems, prevGeoJsonItems, map, hideProcessMessage, showProcessMessage]);

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
