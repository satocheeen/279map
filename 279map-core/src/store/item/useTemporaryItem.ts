import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { TemporaryItem, temporaryItemsAtom } from ".";

/**
 * 登録・更新・削除処理中のアイテムを一時管理するためのフック
 */
let count = 0;
export default function useTemporaryItem() {

    /**
     * 一時アイテムを追加する
     */
    const addTemporaryItem = useAtomCallback(
        useCallback((get, set, temporaryItem: Omit<TemporaryItem, 'tempId'>) => {
            // ID付与
            const tempId = `temp-${++count}`;

            set(temporaryItemsAtom, (cur) => {
                return cur.concat(Object.assign({}, temporaryItem, { tempId }));
            })

            return tempId;
        }, [])
    )

    /**
     * 一時アイテムを削除する
     */
    const removeTemporaryItem = useAtomCallback(
        useCallback((get, set, tempId: string) => {
            set(temporaryItemsAtom, (cur) => {
                return cur.filter(cur => cur.tempId !== tempId);
            })
        }, [])
    )

    return {
        addTemporaryItem,
        removeTemporaryItem,
    }
}