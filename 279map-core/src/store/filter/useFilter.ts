import { useCallback, useMemo } from "react";
import { DataId } from "279map-common";
import { isEqualId } from "../data/dataUtility";
import { useRecoilValue } from "recoil";
import { filteredItemsState } from ".";

type FilterStatus = 'Normal' | 'UnFiltered' | 'Filtered';

/**
 * フィルタ状態を判断するフック
 */
export function useFilter() {
    const filteredItems = useRecoilValue(filteredItemsState);

    /**
     * 指定のアイテムのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatusOfTheItem = useCallback((itemId: DataId): FilterStatus => {
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

    }, [filteredItems]);

    /**
     * 指定のコンテンツのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatusOfTheContent = useCallback((contentId: DataId): FilterStatus => {
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

    }, [filteredItems]);

    return {
        getFilterStatusOfTheItem,
        getFilterStatusOfTheContent,
    }
}