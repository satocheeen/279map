import { useCallback } from "react";
import { useMap } from "../../components/map/useMap";
import { GetItemsAPI, GetItemsParam } from "tsunagumap-api";
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from 'recoil';
import { ItemsMap, initialItemLoadedState, allItemsAtom } from ".";
import { isEqualId } from "../../util/dataUtility";
import { DataId, ItemContentInfo, ItemDefine } from "279map-common";
import { visibleDataSourceIdsState } from "../datasource";
import { filteredContentIdListState } from "../filter";
import { useAtomCallback } from 'jotai/utils';
import { useAtom } from 'jotai';

/**
 * アイテム関連フック
 * @returns 
 */
export function useItem() {
    const { getApi } = useMap();
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const setInitialItemLoaded = useSetRecoilState(initialItemLoadedState);

    const [_, setAllItems ] = useAtom(allItemsAtom);
    const resetItems = useRecoilCallback(({reset}) => async() => {
        setAllItems({});
        reset(initialItemLoadedState);
    }, []);

    /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
    const loadItems = useAtomCallback(
        useCallback(async(get, set, param: Omit<GetItemsParam, 'dataSourceIds'>) => {
            try {
                const apiResult = await getApi().callApi(GetItemsAPI, {
                    extent: param.extent,
                    zoom: param.zoom,
                    dataSourceIds: visibleDataSourceIds,
                });
        
                const items = apiResult.items;
                if (items.length === 0) return;
    
                // データソース単位で保管
                const dsMap = {} as {[id: string]: ItemDefine[]};
                items.forEach(item => {
                    const dsId = item.id.dataSourceId;
                    if (dsId in dsMap) {
                        dsMap[dsId].push(item);
                    } else {
                        dsMap[dsId] = [item];
                    }
                });
                set(allItemsAtom, (currentItemMap) => {
                    const newItemsMap = Object.assign({}, currentItemMap);
                    for(const entry of Object.entries(dsMap)) {
                        const itemMap = entry[1].reduce((acc, cur) => {
                            acc[cur.id.id] = cur;
                            return acc;
                        }, {} as ItemsMap)
                        newItemsMap[entry[0]] = itemMap;
                    }
                    return newItemsMap;
                })

                setInitialItemLoaded(true);
        
            } catch (e) {
                console.warn('loadItems error', e);
                throw e;
            }
    
        }, [getApi, setInitialItemLoaded, visibleDataSourceIds])
    )

    const removeItems = useCallback(async(target: DataId[]) => {
        if (target.length === 0) return;

        setAllItems((currentItemMap) => {
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

    }, [setAllItems]);

    const getItem = useAtomCallback(
        useCallback((get, set, id: DataId) => {
            const itemMap = get(allItemsAtom)[id.dataSourceId] ?? {};
            return itemMap[id.id];
        }, [])
    )

    const filteredContentIdList = useRecoilValue(filteredContentIdListState);
    /**
     * @params itemId {string} the item ID getting descendants' contents
     * @params filtering {boolean} when true, return the length of contents which are fitted with filter conditions.
     */
    const getDescendantContentsIdList = useCallback((itemId: DataId, filtering: boolean): DataId[] => {
        const item = getItem(itemId);
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

    }, [getItem, filteredContentIdList]);

    return {
        resetItems,
        loadItems,
        removeItems,
        getDescendantContentsIdList,
        getItem,
    }
}