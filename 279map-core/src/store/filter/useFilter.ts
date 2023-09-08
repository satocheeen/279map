import { useCallback } from "react";
import { DataId } from "279map-common";
import { isEqualId } from "../../util/dataUtility";
import { filteredItemsAtom } from ".";
import { useAtomCallback } from "jotai/utils";

type FilterStatus = 'Normal' | 'UnFiltered' | 'Filtered';

/**
 * フィルタ状態を判断するフック
 */
export function useFilter() {
    /**
     * 指定のアイテムのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatusOfTheItem = useAtomCallback(
        useCallback((get, set, itemId: DataId): FilterStatus => {
            const filteredItems = get(filteredItemsAtom); 
            if (!filteredItems) {
                return 'Normal';
            }
            const filtered = filteredItems.some(filteredItem => {
                return isEqualId(filteredItem.id, itemId);
            });
            if (filtered) {
                return 'Filtered';
            } else {
                return 'UnFiltered';
            }

        }, [])
    );

    /**
     * 指定のコンテンツのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatusOfTheContent = useAtomCallback(
        useCallback((get, set, contentId: DataId): FilterStatus => {
            const filteredItems = get(filteredItemsAtom); 
            if (!filteredItems) {
                return 'Normal';
            }
            const filtered = filteredItems.some(filteredItem => {
                return filteredItem.contents.some(filteredContent => {
                    return isEqualId(filteredContent, contentId);
                });
            });
            if (filtered) {
                return 'Filtered';
            } else {
                return 'UnFiltered';
            }

        }, [])
    );

    return {
        getFilterStatusOfTheItem,
        getFilterStatusOfTheContent,
    }
}