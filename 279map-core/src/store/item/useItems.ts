import { useCallback } from "react";
import { allItemsAtom } from ".";
import { isEqualId } from "../../util/dataUtility";
import { DataId, ItemContentInfo } from "279map-common";
import { filteredContentIdListAtom } from "../filter";
import { useAtomCallback } from 'jotai/utils';

/**
 * アイテム関連フック
 * @returns 
 */
export function useItems() {

    const removeItems = useAtomCallback(
        useCallback(async(get, set, target: DataId[]) => {
            if (target.length === 0) return;

            set(allItemsAtom, (currentItemMap) => {
                const newItemsMap = Object.assign({}, currentItemMap);
                target.forEach(def => {
                    delete newItemsMap[def.dataSourceId][def.id];
                });
                return newItemsMap;
            });

            // TODO: contentsから除去
            // state.contentsList = state.contentsList.filter(content => {
            //     const isDeleted = action.payload.some(id => isEqualId(content.itemId, id));
            //     return !isDeleted;
            // });

            // eventから除去 TODO: サーバーから再取得して設定

        }, [])
    );

    const getItem = useAtomCallback(
        useCallback((get, set, id: DataId) => {
            const allItems = get(allItemsAtom);
            const itemMap = allItems[id.dataSourceId] ?? {};
            return itemMap[id.id];
        }, [])
    )

    /**
     * @params itemId {string} the item ID getting descendants' contents
     * @params filtering {boolean} when true, return the length of contents which are fitted with filter conditions.
     */
    const getDescendantContentsIdList = useAtomCallback(
        useCallback((get, set, itemId: DataId, filtering: boolean): DataId[] => {
            const item = getItem(itemId);
            if (!item) return [];
            if (item.contents.length===0) return [];

            const filteredContentIdList = get(filteredContentIdListAtom);
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

        }, [getItem])
    )

    return {
        removeItems,
        getDescendantContentsIdList,
        getItem,
    }
}