import { atom } from 'jotai';
import { ItemContent, ItemInfo } from '../../types/types';
import { filteredItemsAtom } from '../filter';
import { DataId } from '../../entry';
import { visibleDataSourceIdsAtom } from '../datasource';

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

const allItemContentListAtom = atom<ItemContent[]>((get) => {
    const allItems = get(allItemsAtom);
    const list = [] as ItemContent[];
    Object.entries(allItems).forEach(([dsId, itemMap]) => {
        Object.entries(itemMap).forEach(([id, item]) => {
            const itemId: DataId = { dataSourceId: dsId, id };
            const contents = [] as DataId[];
            item.contents.forEach(content => {
                contents.push(content.id);
                content.children?.forEach(child => {
                    contents.push(child.id);
                })
            })
            list.push({
                itemId,
                contents,
            })
        })
    })
    return list;
})

/**
 * 現在表示状態にあるアイテム&コンテンツ一覧を返す
 */
export const visibleItemsAtom = atom<ItemContent[]>((get) => {
    const allItems = get(allItemContentListAtom);
    const visibleDataSourceIds = get(visibleDataSourceIdsAtom);
    const filteredItems = get(filteredItemsAtom);
    if (!filteredItems) {
        return allItems.filter(item => visibleDataSourceIds.some(vd => item.itemId.dataSourceId === vd));
    }
    return filteredItems.map((fi): ItemContent => {
        return {
            itemId: fi.id,
            contents: fi.hitContents,
        }
    })
})