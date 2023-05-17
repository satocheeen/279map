import { DataId, ItemContentInfo } from '../279map-common';
import { useCallback } from 'react';
import { useSelector } from "react-redux";
import { RootState } from "./configureStore";
import { useFilter } from './useFilter';
import { getMapKey } from './data/dataUtility';

/**
 * Hook for Contents
 */
export function useContents() {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const { filteredContents } = useFilter();

    /**
     * @params itemId {string} the item ID getting descendants' contents
     * @params filtering {boolean} when true, return the length of contents which are fitted with filter conditions.
     */
    const getDescendantContentsIdList = useCallback((itemId: DataId, filtering: boolean): DataId[] => {
        const item = itemMap[getMapKey(itemId)];
        if (!item) return [];
        if (item.contents.length===0) return [];

        const getDecendant = (content: ItemContentInfo) => {
            const descendantList = [] as DataId[];
            content.children.forEach(child => {
                const isPush = (filtering && filteredContents) ? filteredContents?.includes(child.id) : true;
                if (isPush) {
                    descendantList.push(child.id);
                }
                const childDescendants = getDecendant(child);
                Array.prototype.push.apply(descendantList, childDescendants);
            });
            return descendantList;
        }

        const descendants = item.contents.reduce((acc, cur) => {
            const decendants = getDecendant(cur);
            return acc.concat(decendants);
        }, [] as DataId[]);

        const isPush = (filtering && filteredContents) ? filteredContents?.some((contentId)=> item.contents.some(c => c.id === contentId)) : true;
        const idList = isPush ? item.contents.map(c => c.id) : [];
        Array.prototype.push.apply(idList, descendants);

        return idList;

    }, [itemMap, filteredContents]);

    return {
        getDescendantContentsIdList,
    }

}