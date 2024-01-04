import { useCallback } from "react";
import { allItemsAtom } from ".";
import { useAtomCallback } from 'jotai/utils';
import { DataId } from "../../types-common/common-types";

/**
 * アイテム関連フック
 * @returns 
 */
export function useItems() {

    const removeItems = useAtomCallback(
        useCallback(async(get, set, target: DataId[]) => {
            if (target.length === 0) return;

            set(allItemsAtom, (currentItemMap) => {
                const newItemsMap = Object.assign({}, currentItemMap);
                target.forEach(def => {
                    delete newItemsMap[def.dataSourceId][def.id];
                });
                return newItemsMap;
            });

            // TODO: contentsから除去
            // state.contentsList = state.contentsList.filter(content => {
            //     const isDeleted = action.payload.some(id => isEqualId(content.itemId, id));
            //     return !isDeleted;
            // });

            // eventから除去 TODO: サーバーから再取得して設定

        }, [])
    );

    const getItem = useAtomCallback(
        useCallback((get, set, id: DataId) => {
            const allItems = get(allItemsAtom);
            const itemMap = allItems[id.dataSourceId] ?? {};
            return itemMap[id.id];
        }, [])
    )

    return {
        removeItems,
        getItem,
    }
}