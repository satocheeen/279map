import { useCallback } from "react";
import { allItemsAtom, storedItemsAtom } from ".";
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

            set(storedItemsAtom, (currentItems) => {
                // const newItemsMap = Object.assign({}, currentItems);
                return currentItems.filter(item => {
                    return !target.includes(item.id);
                })
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
            return allItems.find(item => item.id === id);
        }, [])
    )

    return {
        removeItems,
        getItem,
    }
}