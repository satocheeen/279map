import { useCallback } from "react";
import { isEqualId } from "../../util/dataUtility";
import { filteredDatasAtom, filteredItemIdListAtom } from ".";
import { useAtomCallback } from "jotai/utils";
import { DataId } from "../../types-common/common-types";

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
            const filteredItems = get(filteredItemIdListAtom); 
            if (!filteredItems) {
                return 'Normal';
            }
            const filtered = filteredItems.includes(itemId);
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
            const filteredItems = get(filteredDatasAtom); 
            if (!filteredItems) {
                return 'Normal';
            }
            const filtered = filteredItems.includes(contentId);
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