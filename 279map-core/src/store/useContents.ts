import { DataId, ItemContentInfo } from '279map-common';
import { useCallback } from 'react';
import { getMapKey, isEqualId } from './data/dataUtility';
import { itemMapState } from './data/dataAtom';
import { useRecoilValue } from 'recoil';
import { filteredContentIdListState } from './filter';

/**
 * Hook for Contents
 */
export function useContents() {
    const itemMap = useRecoilValue(itemMapState);
    const filteredContentIdList = useRecoilValue(filteredContentIdListState);

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
                const isPush = (filtering && filteredContentIdList) ? filteredContentIdList.some(filtered => isEqualId(filtered, child.id)) : true;
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

        const idList = item.contents.filter(c => {
            const isPush = (filtering && filteredContentIdList) ? filteredContentIdList.some(filtered => isEqualId(filtered, c.id)) : true;
            return isPush;
        }).map(c => c.id);
        Array.prototype.push.apply(idList, descendants);

        return idList;

    }, [itemMap, filteredContentIdList]);

    return {
        getDescendantContentsIdList,
    }

}