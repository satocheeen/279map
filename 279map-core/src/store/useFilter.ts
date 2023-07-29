import { useCallback, useMemo } from "react";
import { DataId } from "279map-common";
import { isEqualId } from "./data/dataUtility";
import { useRecoilValue } from "recoil";
import { filteredItemsState } from "./operation/operationAtom";

type FilterStatus = 'Normal' | 'UnFiltered' | 'Filtered';

/**
 * フィルタ状態を判断するフック
 */
export function useFilter() {
    const filteredItems = useRecoilValue(filteredItemsState);

    /**
     * フィルタがかかっている状態か
     */
    const isFiltered = useMemo(() => {
        return filteredItems !== null;
    }, [filteredItems]);


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

    /**
     * フィルタのかかっているアイテムidを返す。
     * フィルタ設定されていない場合は、undefined.
     */
    const filteredItemIdList = useMemo(() => {
        if (!filteredItems) {
            return undefined;
        }
        return filteredItems.map(fi => fi.id);

    }, [filteredItems]);

    /**
     * フィルタのかかっているコンテンツidを返す。
     * フィルタ設定されていない場合は、undefined.
     */
    const filteredContentIdList = useMemo(() => {
        if (!filteredItems) {
            return undefined;
        }
        return filteredItems.reduce((acc, cur) => {
            return acc.concat(cur.contents);
        }, [] as DataId[]);

    }, [filteredItems]);

    return {
        isFiltered,
        getFilterStatusOfTheItem,
        getFilterStatusOfTheContent,
        filteredItems,
        filteredItemIdList,
        filteredContentIdList,
    }
}