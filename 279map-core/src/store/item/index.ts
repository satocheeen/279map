import { atom } from 'jotai';
import { ItemType, ItemInfo } from '../../types/types';
import { filteredItemsAtom } from '../filter';
import { DataId } from '../../entry';
import { UpdateItemInput } from '../../graphql/generated/graphql';
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

// バックエンドから取得したアイテム情報
export const storedItemsAtom = atom({} as ItemsByDatasourceMap);

// 登録・更新・削除処理中のアイテム
export type ItemProcessType = {
    processId: string;     // 処理ID
    error?: boolean;    // 処理失敗時にtrue
} & ({
    // temporary: 呼び出し元から渡された値で一時描画したもの
    status: 'registing' | 'temporary';
    item: Pick<ItemInfo, 'id' | 'geometry' | 'geoProperties'>;
} | {
    status: 'updating';
    items: UpdateItemInput[];
} | {
    status: 'deleting';
    itemId: DataId;
})
export const itemProcessesAtom = atom<ItemProcessType[]>([]);

export const allItemsAtom = atom<ItemsByDatasourceMap>((get) => {
    const storedItems = get(storedItemsAtom);
    const itemProcesses = get(itemProcessesAtom);

    const result = structuredClone(storedItems);
    itemProcesses.forEach(itemProcess => {
        if (itemProcess.status === 'registing' || itemProcess.status === 'temporary') {
            const item: ItemInfo = {
                id: itemProcess.item.id,
                geometry: itemProcess.item.geometry,
                geoProperties: itemProcess.item.geoProperties,
                name: '',
                contents: [],
                hasContents: false,
                hasImageContentId: [],
                lastEditedTime: '',
                temporary: itemProcess.status,
            }
            if (!result[itemProcess.item.id.dataSourceId]) {
                result[itemProcess.item.id.dataSourceId] = {};
            }
            result[itemProcess.item.id.dataSourceId][itemProcess.item.id.id] = item;

        } else if (itemProcess.status === 'updating') {
            itemProcess.items.forEach(tempItem => {
                Object.assign(result[tempItem.id.dataSourceId][tempItem.id.id], tempItem, {
                    lastEditedTime: '',
                    temporary: 'updating',
                });
            })
        } else if (itemProcess.status === 'deleting') {
            // エラー時は半透明表示するので残す
            if (!itemProcess.error) {
                // 削除中に地図切り替えをしている場合は存在しないので
                if (result[itemProcess.itemId.dataSourceId] && result[itemProcess.itemId.dataSourceId][itemProcess.itemId.id]) {
                    delete result[itemProcess.itemId.dataSourceId][itemProcess.itemId.id];
                }
            }
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

/**
 * ロード済みのアイテム一覧
 */
export const allItemContentListAtom = atom<ItemType[]>((get) => {
    const allItems = get(allItemsAtom);
    const filteredItems = get(filteredItemsAtom);
    const list = [] as ItemType[];
    Object.entries(allItems).forEach(([dsId, itemMap]) => {
        Object.entries(itemMap).forEach(([id, item]) => {
            const itemId: DataId = { dataSourceId: dsId, id };
            const filterdItemInfo = !filteredItems ? undefined : filteredItems.find(fi => isEqualId(fi.id, itemId));

            const belongContents = item.contents.reduce((acc, cur) => {
                const childrenIds = cur.children?.map(child => child.id) ?? [];
                return [...acc, cur.id, ...childrenIds];
            }, [] as DataId[]);
            const contents = [] as ItemType['contents'];
            belongContents.forEach(contentId => {
                const hit = filterdItemInfo?.hitContents.some(hc => isEqualId(hc, contentId));
                contents.push({
                    id: contentId,
                    filterHit: hit,
                });
            })
            list.push({
                id: itemId,
                name: item.name,
                lastEditedTime: item.lastEditedTime,
                filterHit: filterdItemInfo?.hitItem,
                contents,
            })
        })
    })
    return list;
})

// /**
//  * 現在表示状態にあるアイテム&コンテンツ一覧を返す
//  */
// export const visibleItemsAtom = atom<ItemContent[]>((get) => {
//     const allItems = get(allItemContentListAtom);
//     const visibleDataSourceIds = get(visibleDataSourceIdsAtom);
//     const filteredItems = get(filteredItemsAtom);
//     if (!filteredItems) {
//         return allItems.filter(item => visibleDataSourceIds.some(vd => item.itemId.dataSourceId === vd));
//     }
//     return filteredItems.map((fi): ItemContent => {
//         return {
//             itemId: fi.id,
//             contents: fi.hitContents,
//         }
//     })
// })