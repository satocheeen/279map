import { ItemContentInfo } from '279map-common';
import { useCallback } from 'react';
import { useSelector } from "react-redux";
import { RootState } from "./configureStore";
import { useFilter } from './useFilter';

/**
 * Hook for Contents
 */
export function useContents() {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const { filterTargetContentIds } = useFilter();

    /**
     * @params itemId {string} the item ID getting descendants' contents
     * @params filtering {boolean} when true, return the length of contents which are fitted with filter conditions.
     */
    const getDescendantContentsIdList = useCallback((itemId: string, filtering: boolean): string[] => {
        const item = itemMap[itemId];
        if (!item) return [];
        if (!item.contents) return [];

        const getDecendant = (content: ItemContentInfo) => {
            const descendantList = [] as string[];
            content.children.forEach(child => {
                const isPush = (filtering && filterTargetContentIds) ? filterTargetContentIds?.includes(child.id) : true;
                if (isPush) {
                    descendantList.push(child.id);
                }
                const childDescendants = getDecendant(child);
                Array.prototype.push.apply(descendantList, childDescendants);
            });
            return descendantList;
        }

        const descendants = getDecendant(item.contents);

        const isPush = (filtering && filterTargetContentIds) ? filterTargetContentIds?.includes(item.contents.id) : true;
        const idList = isPush ? [item.contents.id] : [];
        Array.prototype.push.apply(idList, descendants);

        return idList;

    }, [itemMap, filterTargetContentIds]);

    return {
        getDescendantContentsIdList,
    }

}