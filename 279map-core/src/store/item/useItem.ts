import { useCallback } from "react";
import { useMap } from "../../components/map/useMap";
import { GetItemsAPI, GetItemsParam } from "tsunagumap-api";
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ItemsMap, initialItemLoadedState, allItemsAtom, loadedItemKeysAtom, LoadedItemKey } from ".";
import { isEqualId } from "../../util/dataUtility";
import { DataId, ItemContentInfo } from "279map-common";
import { filteredContentIdListState } from "../filter";
import { useAtomCallback } from 'jotai/utils';
import { useAtom } from 'jotai';
import { dataSourcesAtom, visibleDataSourceIdsAtom } from "../datasource";
import { Extent } from '279map-common';

function divideExtent(ext: Extent): Extent[] {
    const d = 10;
    const startX = Math.floor(Math.min(ext[0], ext[2]) / d) * d;
    const endX = Math.max(ext[0], ext[2]);
    const startY = Math.floor(Math.min(ext[1], ext[3]) / d) * d;
    const endY = Math.max(ext[1], ext[3]);

    const list = [] as Extent[];
    for (let y = startY; y<=endY; y+=d) {
        for (let x = startX; x <= endX; x+=d) {
            list.push([
                x, y, x + d, y + d
            ])
        }
    }
    return list;
}

/**
 * アイテム関連フック
 * @returns 
 */
export function useItem() {
    const { getApi } = useMap();
    const setInitialItemLoaded = useSetRecoilState(initialItemLoadedState);
    const setInitialItemLoadedState = useSetRecoilState(initialItemLoadedState);
    const [_, setAllItems ] = useAtom(allItemsAtom);

    const resetItems = useAtomCallback(
        useCallback(async(get, set) => {
            set(allItemsAtom, {});
            set(loadedItemKeysAtom, []);
            setInitialItemLoadedState(false);
        }, [setInitialItemLoadedState])
    );

    /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
    const loadItems = useAtomCallback(
        useCallback(async(get, set, param: Omit<GetItemsParam, 'dataSourceIds'>) => {
            try {
                // 未ロードのデータのみロードする
                // -- extentは一定サイズに分割する
                const extents = divideExtent(param.extent);
                // -- zoomは小数点以下は切り捨てる
                const zoom = Math.floor(param.zoom);
                const loadedItemsKeys = get(loadedItemKeysAtom);
                const datasources = get(dataSourcesAtom);
                const visibleDataSourceIds = get(visibleDataSourceIdsAtom);

                const targetKeys = extents.reduce((acc, cur) => {
                    const keys = visibleDataSourceIds.map((datasourceId): LoadedItemKey => {
                        // データソースがGPXの場合は、ZoomLv.も
                        const dsInfo = datasources.find(ds => ds.dataSourceId === datasourceId);
                        const zoomKey = dsInfo?.itemContents.Track ? zoom : undefined;
                        return {
                            datasourceId,
                            extent: cur,
                            zoom: zoomKey,
                        }
                    });
                    return acc.concat(keys);
                }, [] as LoadedItemKey[])
                .filter(key => {
                    return !loadedItemsKeys.some(loaded => {
                        if (loaded.datasourceId !== key.datasourceId) {
                            return false;
                        }
                        if (JSON.stringify(loaded.extent) !== JSON.stringify(key.extent)) {
                            return false;
                        }
                        if (loaded.zoom && loaded.zoom !== key.zoom) {
                            return false;
                        }
                        return true;
                    });
                });

                if (targetKeys.length === 0) return;

                for (const key of targetKeys) {
                    const apiResult = await getApi().callApi(GetItemsAPI, {
                        extent: key.extent,
                        zoom,
                        dataSourceIds: [key.datasourceId],
                    });
                    const items = apiResult.items;

                    // ロード済みデータ条件を保管
                    set(loadedItemKeysAtom, (current) => {
                        return current.concat(key);
                    })

                    if (items.length === 0) continue;
    
                    const itemMap: ItemsMap = {};
                    items.forEach(item => {
                        itemMap[item.id.id] = item;
                    });
                    set(allItemsAtom, (currentItemMap) => {
                        const newItemsMap = Object.assign({}, currentItemMap, {
                            [key.datasourceId]: itemMap,
                        });
                        return newItemsMap;
                    })
                }

                setInitialItemLoaded(true);
        
            } catch (e) {
                console.warn('loadItems error', e);
                throw e;
            }
    
        }, [getApi, setInitialItemLoaded])
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