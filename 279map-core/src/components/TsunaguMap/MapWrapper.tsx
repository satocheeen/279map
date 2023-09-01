import React, { useContext, useEffect, useCallback } from 'react';
import { doCommand } from '../../util/Commander';
import MapChart from './MapChart';
import { OwnerContext } from './TsunaguMap';
import { Extent } from '279map-common';
import { useWatch } from '../../util/useWatch';
import { useMap } from '../map/useMap';
import { useSubscribe } from '../../util/useSubscribe';
import { useItem } from '../../store/item/useItem';
import { selectedItemIdsAtom } from '../../store/operation';
import { currentMapKindAtom, mapDefineLoadableAtom } from '../../store/session';
import { itemDataSourcesAtom } from '../../store/datasource';
import { useAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { loadedItemKeysAtom } from '../../store/item';
import { checkContaining } from '../../util/MapUtility';

type Props = {
    onInitialized?: () => void;
};

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
export default function MapWrapper(props: Props) {
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);

    const { getMap } = useMap();

    const { removeItems } = useItem();

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
    const { subscribeMap: subscribe, unsubscribeMap: unsubscribe } = useSubscribe();
    useWatch(() => {
        if (!currentMapKind) return;

        subscribe('mapitem-update', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-update') {
                // 指定のエクステントをロード済み対象から除去する
                clearLoadedArea(payload.targets);

                doCommand({
                    command: "LoadLatestData",
                    param: undefined,
                });
            }
        });
        subscribe('mapitem-delete', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        return () => {
            unsubscribe('mapitem-update', currentMapKind, undefined);
            unsubscribe('mapitem-delete', currentMapKind, undefined);
        }
    }, [currentMapKind]);

    /**
     * レイヤの表示・非表示切り替え
     */
    useWatch(() => {
        getMap()?.updateLayerVisible(itemDataSources);

    }, [itemDataSources]);

    /**
     * 1アイテムが選択されたら詳細ダイアログ表示
     */
    const [selectedItemIds] = useAtom(selectedItemIdsAtom);
    const { disabledContentDialog } = useContext(OwnerContext);
    useWatch(() => {
        if (selectedItemIds.length === 1 && !disabledContentDialog) {
            doCommand({
                command: 'ShowItemInfo',
                param: selectedItemIds[0],
            });
        }
    }, [selectedItemIds]);

    const [mapDefineLoadable] = useAtom(mapDefineLoadableAtom);

    useEffect(() => {
        if (mapDefineLoadable.state === 'hasData') {
            if (props.onInitialized) {
                props.onInitialized();
            }
        }
    }, [mapDefineLoadable, props])

    return (
        <MapChart />
    );
}
