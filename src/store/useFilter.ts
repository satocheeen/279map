import { useCallback, useMemo } from "react";
import { useSelector, shallowEqual } from "react-redux";
import { RootState } from "./configureStore";
import { FilterDefine } from "./operation/operationSlice";
import dayjs from 'dayjs';
import { useCategory } from "./useCategory";
import { ItemContentInfo, ItemDefine } from "279map-common";

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
    if (!item.contents) {
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
    return getChildren(item.contents);
}
/**
 * フィルタ状態を判断するフック
 */
export function useFilter() {
    const { filter, itemMap, events } = useSelector((state: RootState) => {
        return {
            filter: state.operation.filter,
            itemMap: state.data.itemMap,
            events: state.data.events,
        }
    }, shallowEqual);

    const { categoryMap } = useCategory();

    /**
     * 指定のtypeのフィルタがかかっていたら返す
     */
    const getTheFilter = useCallback((type: FilterDefine['type']) => {
        return filter.filter(f => f.type === type);
    }, [filter]);

    /**
     * フィルタがかかっている状態か
     */
    const isFiltered = useMemo(() => {
        return filter.length > 0;
    }, [filter]);


    /**
     * フィルタが掛かっている場合に、フィルタ条件を満たすコンテンツID一覧を返す.
     * フィルタが掛かっていない場合は、undefinedを返す。
     */
    const filterTargetContentIds = useMemo((): string[] | undefined => {
        if (filter.length === 0) {
            return undefined;
        }
        // フィルタはAND条件
        // -- 1. 全コンテンツIdをセット
        let contentsIdList = [] as string[];
        Object.values(itemMap).forEach(item => {
            getDescendantContents(item).forEach(c => {
                contentsIdList.push(c.id);
            })
        });
        // -- 2. フィルタ条件に該当しないものを外していく
        filter.forEach(filterDef => {
            if (filterDef.type === 'category') {
                const categoryInfo = categoryMap.get(filterDef.categoryName);
                contentsIdList = contentsIdList.filter(contentId => {
                    return categoryInfo?.contents.some(filterCategoryContent => filterCategoryContent.content_id === contentId);
                });
            } else if (filterDef.type === 'calendar') {
                const date = filterDef.date;
                // 指定日付のイベントに紐づくコンテンツID一覧取得
                const targetEventContentIds = events.filter(evt => {
                    return dayjs(evt.date).format('YYYYMMDD') === dayjs(date).format('YYYYMMDD');
                })
                .map(evt => evt.content_id);
                contentsIdList = contentsIdList.filter(contentId => targetEventContentIds.includes(contentId));
            }
        });
        return contentsIdList;
    }, [filter, itemMap, events, categoryMap]);

    /**
     * 指定のアイテムのフィルタ状態を返す
     * @return フィルタ設定されていない場合、Normal。フィルタ対象の場合、Filtered。フィルタ対象外の場合、UnFiltered。
     */
    const getFilterStatus = useCallback((itemId: string): FilterStatus => {
        if (filter.length === 0) {
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
        if (!target.contents) {
            return {
                status: 'UnFiltered'
            };
        }
        const targetContentIds = getDescendantContents(target).map(c => c.id);
        const filtered = targetContentIds.some(targetContentId => {
            return filterTargetContentIds?.includes(targetContentId);
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

    }, [filter, itemMap, filterTargetContentIds]);

    /**
     * フィルタのかかっているアイテムidを返す。
     * フィルタ設定されていない場合は、undefined.
     */
    const filteredItemIdList = useMemo(() => {
        if (filterTargetContentIds === undefined) {
            return undefined;
        }
        return Object.values(itemMap).filter(item => {
            if (!item.contents) {
                return false;
            }
            const check = (content: ItemContentInfo): boolean => {
                if (filterTargetContentIds.includes(content.id)) {
                    return true;
                }
                if (content.children.length === 0) {
                    return false;
                }
                return content.children.some(child => {
                    return check(child);
                });    
            }
            return check(item.contents);
        }).map(item => item.id);

    }, [filterTargetContentIds, itemMap]);

    return {
        getTheFilter,
        isFiltered,
        getFilterStatus,
        filterTargetContentIds,
        filteredItemIdList,
    }
}