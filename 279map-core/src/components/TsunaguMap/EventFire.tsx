import { Extent } from '279map-common';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { loadedItemKeysAtom } from '../../store/item';
import { checkContaining } from '../../util/MapUtility';
import { useSubscribe } from '../../util/useSubscribe';
import { currentMapKindAtom } from '../../store/session';
import { useAtom } from 'jotai';
import { useItem } from '../../store/item/useItem';
import { doCommand } from '../../util/Commander';
import { itemDataSourcesAtom } from '../../store/datasource';
import { useMap } from '../map/useMap';
import { dialogTargetAtom, selectedItemIdsAtom } from '../../store/operation';
import { OwnerContext } from './TsunaguMap';
import { usePrevious } from '../../util/usePrevious';

const ContentsModal = lazy(() => import('../contents/ContentsModal'));

/**
 * Jotaiの変更検知して、特定のイベントを実行するコンポーネントもどき
 * @returns 
 */
export default function EventFire() {
    return (
        <>
            <MapSubscriber />
            <LayerVisibleChanger />
            <ItemSelectListener />
        </>
    )
}

/**
 * 地図種別の変更検知して、地図に対してsubscribe, unsubscribeする
 */
function MapSubscriber() {
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

    useEffect(() => {
        if (!currentMapKind) return;

        subscribeMap('mapitem-update', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-update') {
                // 指定のエクステントをロード済み対象から除去する
                clearLoadedArea(payload.targets);

                doCommand({
                    command: "LoadLatestData",
                    param: undefined,
                });
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
    }, [currentMapKind, removeItems, subscribeMap, unsubscribeMap, clearLoadedArea]);

    return null;

}

/**
 * データソース情報の変更検知して、レイヤの表示・非表示切り替え
 */
function LayerVisibleChanger() {
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
    const { getMap } = useMap();

    useEffect(() => {
        getMap()?.updateLayerVisible(itemDataSources);

    }, [itemDataSources, getMap]);

    return null;
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