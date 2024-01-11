import { atom } from 'jotai';
import { ItemInfo } from '../../types/types';
import { filteredItemsAtom } from '../filter';
import { isEqualId } from '../../util/dataUtility';

export type LoadedItemKey = {
    datasourceId: string;
    zoom?: number;
}

export type LoadedAreaInfo = {
    geometry: GeoJSON.Geometry;
}
type LoadedItemMap = {[datasourceId: string]: LoadedAreaInfo};
export const loadedItemMapAtom = atom<LoadedItemMap>({});

export type ItemsMap = {[itemId: string]: ItemInfo};
export type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);

/**
 * データソース単位の取得済みアイテムの最終更新日時
 */
export const latestEditedTimeOfDatasourceAtom = atom((get) => {
    const allItems = get(allItemsAtom);
    const resultMap = {} as {[datasourceId: string]: string};
    Object.entries(allItems).forEach(([key, itemMap]) => {
        const latestEditedTime = Object.values(itemMap).reduce((acc, cur) => {
            if (cur.lastEditedTime.localeCompare(acc) > 0) {
                return cur.lastEditedTime;
            } else {
                return acc;
            }
        }, '');
        resultMap[key] = latestEditedTime;
    });
    return resultMap;
})

/**
 * 現在表示状態にあるアイテム一覧を返す
 */
export const visibleItemsAtom = atom((get) => {
    const allItems = get(allItemsAtom);
    const filteredItems = get(filteredItemsAtom);
    if (!filteredItems) {
        return allItems;
    }
    const result = {} as ItemsByDatasourceMap;
    Object.entries(allItems).forEach(([dsId, itemMap]) => {
        const newItemMap = {} as ItemsMap;
        Object.entries(itemMap).forEach(([itemId, item]) => {
            const visible = filteredItems.some(fi => isEqualId(fi.id, item.id));
            if (visible) {
                newItemMap[itemId] = item;
            }
        })
        if (Object.values(newItemMap).length > 0) {
            result[dsId] = newItemMap;
        }
    })
    return result;
})