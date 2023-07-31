import { useCallback } from "react";
import { useMap } from "../../components/map/useMap";
import { GetItemsAPI, GetItemsParam } from "tsunagumap-api";
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { itemMapState } from ".";
import { getMapKey, isEqualId } from "../../util/dataUtility";
import { DataId, ItemContentInfo } from "279map-common";
import { dataSourceGroupsState } from "../datasource";
import { filteredContentIdListState } from "../filter";

/**
 * アイテム関連フック
 * @returns 
 */
export function useItem() {
    const dataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const { getApi } = useMap();
    const setItemMap = useSetRecoilState(itemMapState);

    /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
    const loadItems = useCallback(async(param: Omit<GetItemsParam, 'dataSourceIds'>) => {
        try {
            const dataSourceIds: string[] = [];
            for (const group of dataSourceGroups) {
                if (!group.visible) continue;
                for (const ds of group.dataSources) {
                    if (!ds.visible) continue;
                    dataSourceIds.push(ds.dataSourceId);
                }
            }
            const apiResult = await getApi().callApi(GetItemsAPI, {
                extent: param.extent,
                zoom: param.zoom,
                dataSourceIds,
            });
    
            const items = apiResult.items;
            if (items.length === 0) return;

            setItemMap((currentItemMap) => {
                const itemMap = Object.assign({}, currentItemMap);
                items.forEach(def => {
                    itemMap[getMapKey(def.id)] = def;
                });
                return itemMap;
            });
    
        } catch (e) {
            console.warn('loadItems error', e);
            throw e;
        }

    }, [dataSourceGroups, getApi, setItemMap]);

    const removeItems = useCallback(async(target: DataId[]) => {
        if (target.length === 0) return;

        setItemMap((currentItemMap) => {
            const itemMap = Object.assign({}, currentItemMap);
            target.forEach(def => {
                delete itemMap[getMapKey(def)];
            });
            return itemMap;
        });

        // TODO: contentsから除去
        // state.contentsList = state.contentsList.filter(content => {
        //     const isDeleted = action.payload.some(id => isEqualId(content.itemId, id));
        //     return !isDeleted;
        // });

        // eventから除去 TODO: サーバーから再取得して設定

    }, [setItemMap]);

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
        loadItems,
        removeItems,
        getDescendantContentsIdList,
    }
}