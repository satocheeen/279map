import { atom } from 'jotai';
import { ItemType, ItemInfo, OverrideItem } from '../../types/types';
import { filteredDatasAtom } from '../filter';
import { ContentValueMap, DataId, GeoProperties } from '../../entry';
import { UpdateItemInput } from '../../graphql/generated/graphql';
import { visibleDataSourceIdsAtom } from '../datasource';
import { Geometry } from 'geojson';

export type LoadedItemKey = {
    datasourceId: string;
    zoom?: number;
}

export type LoadedAreaInfo = {
    geometry: GeoJSON.Geometry;
}
type LoadedItemMap = {[datasourceId: string]: LoadedAreaInfo};
export const loadedItemMapAtom = atom<LoadedItemMap>({});

// export type ItemsMap = {[itemId: string]: ItemInfo};
export type ItemsByDatasourceMap = {[dsId: string]: ItemInfo[]};

// バックエンドから取得したアイテム情報
// export const storedItemsAtom = atom({} as ItemsByDatasourceMap);
export const storedItemsAtom = atom([] as ItemInfo[]);
// 呼び出し元から渡された上書きアイテム情報
export const overrideItemsAtom = atom<OverrideItem[]>([]);

type TemporaryDataType = {
    id: DataId;
    item?: {
        geometry: Geometry;
        geoProperties: GeoProperties;
    };
    contents?: ContentValueMap;
    parent?: DataId,
}

// 登録・更新・削除処理中のデータ
export type ItemProcessType = {
    processId: DataId;     // 処理ID
    error?: boolean;    // 処理失敗時にtrue
} & ({
    status: 'registing';
    datasourceId: string;
    data: TemporaryDataType;
} | {
    status: 'updating';
    data: TemporaryDataType;
    // datas: TemporaryDataType[];
    // items: UpdateItemInput[];
} | {
    status: 'deleting';
    itemId: DataId;
})
export const itemProcessesAtom = atom<ItemProcessType[]>([]);

// export const storedItemsFlatListAtom = atom((get) => {
//     const storedItems = get(storedItemsAtom);
//     const list: (ItemInfo & {datasourceId: string})[] = [];
//     Object.entries(storedItems).forEach(([datasourceId, value]) => {
//         Object.values(value).forEach(val => {
//             list.push(Object.assign({}, val, {
//                 datasourceId,
//             }))
//         })
//     })
//     return list;
// })
export const allItemsAtom = atom<ItemInfo[]>((get) => {
    const storedItems = get(storedItemsAtom);
    const itemProcesses = get(itemProcessesAtom);

    let result: ItemInfo[] = structuredClone(storedItems);
    itemProcesses.forEach(itemProcess => {
        if (itemProcess.status === 'registing') {
            if (itemProcess.data.item) {
                const item: ItemInfo = {
                    datasourceId: itemProcess.datasourceId,
                    id: itemProcess.data.id,
                    geometry: itemProcess.data.item.geometry,
                    geoProperties: itemProcess.data.item.geoProperties,
                    name: '',
                    content: itemProcess.data.contents ?
                        {
                            datasourceId: itemProcess.datasourceId,
                            hasImage: false,
                            hasValue: true,
                            id: itemProcess.data.id,
                            usingOtherMap: false,
                        }: undefined,
                    lastEditedTime: '',
                    temporary: itemProcess.status,
                    linkedContents: [],
                }
                result.push(item);
            }

        } else if (itemProcess.status === 'updating') {
            const tempItem = itemProcess.data;
            const currentItem = storedItems.find(item => item.id === tempItem.id);
            if (!currentItem) {
                console.warn('not find');
                return;
            }
            result = result.map((item): ItemInfo => {
                if (item.id === currentItem.id && tempItem.item) {
                    return {
                        id: currentItem.id,
                        datasourceId: currentItem.datasourceId,
                        content: currentItem.content,
                        linkedContents: currentItem.linkedContents,
                        geometry: tempItem.item.geometry ?? currentItem.geometry,
                        geoProperties: tempItem.item.geoProperties ?? currentItem.geoProperties,
                        lastEditedTime: '',
                        name: currentItem.name,
                        temporary: 'updating',
                    }
                } else {
                    return item;
                }
            })
        } else if (itemProcess.status === 'deleting') {
            // エラー時は半透明表示するので残す
            if (!itemProcess.error) {
                // 削除中に地図切り替えをしている場合は存在しないので
                const currentItem = storedItems.find(item => item.id === itemProcess.itemId);
                if (!currentItem) {
                    console.warn('not find');
                    return;
                }
                result = result.filter(item => {
                    return item.id !== currentItem.id;
                })
            }
        }
    })
    const overrideItems = get(overrideItemsAtom);
    overrideItems.forEach((overrideItem, index) => {
        if (overrideItem.type === 'new') {
            const id = overrideItem.tempId;
            const item: ItemInfo = {
                id,
                datasourceId: overrideItem.datasourceId,
                linkedContents: [],
                // id: {
                //     id,
                //     dataSourceId: overrideItem.datasourceId,
                // },
                geometry: overrideItem.geometry,
                geoProperties: overrideItem.geoProperties,
                name: overrideItem.name,
                // hasContents: false,
                // hasImageContentId: [],
                lastEditedTime: '',
            }
            result.push(item);

        } else if (overrideItem.type === 'update') {
            const currentItem = storedItems.find(item => item.id === overrideItem.id);
            if (!currentItem) {
                console.warn('override target not find', overrideItem.id);
            } else {
                result = result.map(item => {
                    if (item.id !== currentItem.id) return item;
                    return {
                        id: item.id,
                        datasourceId: item.datasourceId,
                        linkedContents: item.linkedContents,
                        geometry: overrideItem.geometry ?? item.geometry,
                        geoProperties: overrideItem.geoProperties ?? item.geoProperties,
                        name: overrideItem.name ?? item.name,
                        content: item.content ?? undefined,
                        lastEditedTime: item.lastEditedTime,
                    }
                })
            }

        } else if (overrideItem.type === 'delete') {
            const currentItem = storedItems.find(item => item.id === overrideItem.id);
            if (currentItem) {
                result = result.filter(item => {
                    return item.id !== currentItem.id;
                })

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
    allItems.forEach((item) => {
        const currentVal = resultMap[item.datasourceId];
        if (!currentVal) {
            resultMap[item.datasourceId] = item.lastEditedTime;
        } else if (item.lastEditedTime.localeCompare(currentVal) > 0) {
            resultMap[item.datasourceId] = item.lastEditedTime;
        }
    });
    return resultMap;
})

/**
 * 現在表示状態にあるアイテム一覧を返す
 */
export const showingItemsAtom = atom<ItemType[]>((get) => {
    const storedItems = get(storedItemsAtom);
    const visibleDataSourceIds = get(visibleDataSourceIdsAtom);
    const filteredDatas = get(filteredDatasAtom);

    const items: ItemType[] = [];
    storedItems.forEach((item) => {
        if (!visibleDataSourceIds.includes(item.datasourceId)) return;
        // item.content.
        // const belongContents = item.contents.reduce((acc, cur) => {
        //     const childrenIds = cur.children?.map(child => child.id) ?? [];
        //     return [...acc, cur.id, ...childrenIds];
        // }, [] as DataId[]);
        // const contents = [] as ItemType['contents'];
        // belongContents.forEach(contentId => {
        //     const hit = filterdItemInfo?.hitContents.some(hc => isEqualId(hc, contentId));
        //     contents.push({
        //         id: contentId,
        //         filterHit: hit,
        //     });
        // })

        items.push({
            id: item.id,
            datasourceId: item.datasourceId,
            filterHit: filteredDatas?.includes(item.id),
            content: item.content ? {
                id: item.content.id,
                datasourceId: item.datasourceId,
                usingOtherMap: item.content.usingOtherMap,
                filterHit: filteredDatas?.includes(item.content.id),
            } : undefined,
            linkedContents: item.linkedContents.map(c => {
                return {
                    id: c.id,
                    datasourceId: c.datasourceId,
                    filterHit: filteredDatas?.includes(c.id),
                }
            }) ?? [],
            geoInfo: {
                geometry: item.geometry,
                geoProperties: item.geoProperties,
            },
            lastEditedTime: item.lastEditedTime,
            name: item.name,
        })
    })

    return items;
})