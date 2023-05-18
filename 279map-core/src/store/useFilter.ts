import { useCallback, useMemo } from "react";
import { useSelector, shallowEqual } from "react-redux";
import { RootState } from "./configureStore";
import { ItemContentInfo, ItemDefine } from "279map-common";
import { isEqualId } from "./data/dataUtility";

type FilterStatus = {
    status: 'Normal' | 'UnFiltered';
} | {
    status: 'Filtered';
}

/**
 * Item配下の全コンテンツ情報をリストにして返す
 * @param item 
 * @returns 
 */
function getDescendantContents(item: ItemDefine): ItemContentInfo[] {
    if (item.contents.length === 0) {
        return [];
    }
    const getChildren = (content: ItemContentInfo): ItemContentInfo[] => {
        const childrenList = [] as ItemContentInfo[];
        content.children.forEach(child => {
            childrenList.push(child);
            const descendant = getChildren(child);
            Array.prototype.push.apply(childrenList, descendant);
        });
        return childrenList;
    }
    const contents = item.contents.reduce((acc, cur) => {
        const children = getChildren(cur);
        return acc.concat(cur, children);
    }, [] as ItemContentInfo[]);
    return contents;
}
/**
 * フィルタ状態を判断するフック
 */
export function useFilter() {
    const { filteredContents, itemMap } = useSelector((state: RootState) => {
        return {
            filteredContents: state.operation.filteredContents,
            itemMap: state.data.itemMap,
        }
    }, shallowEqual);

    /**
     * フィルタがかかっている状態か
     */
    const isFiltered = useMemo(() => {
        return filteredContents !== null;
    }, [filteredContents]);


    /**
     * 指定のアイテムのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatus = useCallback((itemId: string): FilterStatus => {
        if (!filteredContents) {
            return {
                status: 'Normal'
            };
        }
        const target = itemMap[itemId];
        if (!target) {
            console.warn('アイテムなし（想定外）');
            return {
                status: 'Normal'
            };
        }
        if (target.contents.length===0) {
            return {
                status: 'UnFiltered'
            };
        }
        const targetContentIds = getDescendantContents(target).map(c => c.id);
        const filtered = targetContentIds.some(targetContentId => {
            return filteredContents.some(fc => isEqualId(fc, targetContentId));
        });
        if (filtered) {
            return {
                status: 'Filtered'
            };
        } else {
            return {
                status: 'UnFiltered'
            };
        }

    }, [filteredContents, itemMap]);

    /**
     * フィルタのかかっているアイテムidを返す。
     * フィルタ設定されていない場合は、undefined.
     */
    const filteredItemIdList = useMemo(() => {
        if (!filteredContents) {
            return undefined;
        }
        return Object.values(itemMap).filter(item => {
            if (item.contents.length===0) {
                return false;
            }
            const check = (content: ItemContentInfo): boolean => {
                if (filteredContents.some(fc => isEqualId(fc, content.id))) {
                    return true;
                }
                if (content.children.length === 0) {
                    return false;
                }
                return content.children.some(child => {
                    return check(child);
                });    
            }
            return item.contents.some(content => check(content));
        }).map(item => item.id);

    }, [filteredContents, itemMap]);

    return {
        isFiltered,
        getFilterStatus,
        filteredContents,
        filteredItemIdList,
    }
}