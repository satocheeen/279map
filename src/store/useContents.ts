import { ItemContentInfo } from '279map-common';
import { useCallback } from 'react';
import { useSelector } from "react-redux";
import { RootState } from "./configureStore";

/**
 * Hook for Contents
 */
export function useContents() {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const getDescendantContentsIdList = useCallback((itemId: string): string[] => {
        const item = itemMap[itemId];
        if (!item) return [];
        if (!item.contents) return [];

        const getDecendant = (content: ItemContentInfo) => {
            const descendantList = [] as string[];
            content.children.forEach(child => {
                descendantList.push(child.id);
                const childDescendants = getDecendant(child);
                Array.prototype.push.apply(descendantList, childDescendants);
            });
            return descendantList;
        }

        const descendants = getDecendant(item.contents);

        const idList = [item.contents.id];
        Array.prototype.push.apply(idList, descendants);

        return idList;

    }, [itemMap]);

    return {
        getDescendantContentsIdList,
    }

}