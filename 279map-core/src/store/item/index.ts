import { atom } from 'jotai';
import { ItemContent, ItemInfo } from '../../types/types';
import { filteredItemsAtom } from '../filter';
import { DataId } from '../../entry';
import { visibleDataSourceIdsAtom } from '../datasource';
import { ItemTemporaryState, UpdateItemInput } from '../../graphql/generated/graphql';

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

// バックエンドから取得したアイテム情報
export const storedItemsAtom = atom({} as ItemsByDatasourceMap);

// 登録・更新・削除処理中のアイテム
export type TemporaryItem = {
    processId: string;     // 処理ID
    status: 'registing';
    item: Pick<ItemInfo, 'id' | 'geoJson' | 'geoProperties'>;
    error?: boolean;    // 処理失敗時にtrue
} | {
    processId: string;     // 処理ID
    status: 'updating';
    item: UpdateItemInput;
    error?: boolean;    // 処理失敗時にtrue
}
export const temporaryItemsAtom = atom<TemporaryItem[]>([]);

export const allItemsAtom = atom<ItemsByDatasourceMap>((get) => {
    const storedItems = get(storedItemsAtom);
    const temporaryItems = get(temporaryItemsAtom);

    const result = structuredClone(storedItems);
    temporaryItems.forEach(tempItem => {
        if (tempItem.status === 'registing') {
            const item: ItemInfo = {
                id: tempItem.item.id,
                geoJson: tempItem.item.geoJson,
                geoProperties: tempItem.item.geoProperties,
                name: '',
                contents: [],
                hasContents: false,
                hasImageContentId: [],
                lastEditedTime: '',
                temporary: ItemTemporaryState.Registing,
            }
            if (!result[tempItem.item.id.dataSourceId]) {
                result[tempItem.item.id.dataSourceId] = {};
            }
            result[tempItem.item.id.dataSourceId][tempItem.item.id.id] = item;
        }
    })

    return result;
});

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