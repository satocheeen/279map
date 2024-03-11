import { atom } from 'jotai';
import { currentMapDefineAtom } from '../session';
import { DatasourceVisible, DatasourceVisibleGroup, ItemDatasourceVisibleList } from '../../types/types';

/**
 * データソース関連のRecoil
 */

// レイヤ表示情報 key=データソースid
type ItemLayerVisibleInfo = {[id: string]: boolean};

/**
 * データソースの表示・非表示情報（ユーザから明示的に指定されたものを格納）
 */
export const dataSourceVisibleAtom = atom<ItemLayerVisibleInfo>({});

/**
 * データソースグループをデータソースにばらしたもの
 */
export const itemDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.itemDataSources;
})

/**
 * アイテムデータソースの表示情報一覧
 */
const itemDatasourceVisibleListAtom = atom((get) => {
    const dataSources = get(itemDataSourcesAtom);
    const visibleInfo = get(dataSourceVisibleAtom);
    return dataSources.map((ds): (DatasourceVisible & {groupName?: string}) => {
        const visible = visibleInfo[ds.datasourceId] ?? ds.initialVisible;
        return {
            type: 'datasource',
            datasourceId: ds.datasourceId,
            visible,
            groupName: ds.groupName ?? undefined,
        }
    });
})

/**
 * 表示状態にあるアイテムデータソースのID一覧
 */
export const visibleDataSourceIdsAtom = atom((get) => {
    const dataSources = get(itemDatasourceVisibleListAtom);
    return dataSources.filter(ds => ds.visible).map(ds => ds.datasourceId);
})

/**
 * 現在のアイテムレイヤの表示状態情報
 */
export const itemDatasourcesWithVisibleAtom = atom<ItemDatasourceVisibleList>((get) => {
    const itemDatasourceVisibleList = get(itemDatasourceVisibleListAtom);

    // グループになるものをまとめる
    const groupNames = itemDatasourceVisibleList.reduce((acc, cur) => {
        if (!cur.groupName) return acc;
        if (acc.includes(cur.groupName)) return acc;
        return [...acc, cur.groupName];
    }, [] as string[]);

    const groups = groupNames.map((groupName): DatasourceVisibleGroup => {
        const datasources = itemDatasourceVisibleList
                                .filter(ds => ds.groupName === groupName);
        const visible = datasources.every(ds => ds.visible);
        return {
            type: 'group',
            groupName,
            datasources,
            visible,
        }
    })

    // グループにならないもの
    const noGroupDsList = itemDatasourceVisibleList.filter(ds => !ds.groupName);

    const list = [...groups, ...noGroupDsList];

    // ソート
    const listWithOrder = list.map(item => {
        const order = function() {
            if (item.type === 'group') {
                // groupの場合は、最も若いindex
                const orderList = item.datasources.map(ds => {
                    const index = itemDatasourceVisibleList.findIndex(iv => iv.datasourceId === ds.datasourceId);
                    return index;
                });
                return Math.min(...orderList);
            } else {
                return itemDatasourceVisibleList.findIndex(iv => iv.datasourceId === item.datasourceId);
            }
        }();
        return Object.assign({}, item, { order });
    });
    return listWithOrder
        .sort((a, b) => a.order - b.order)
        .map(item => {
            const newItem = JSON.parse(JSON.stringify(item));
            delete newItem.order;
            return newItem;
        });
})

/**
 * コンテンツのデータソース一覧
 */
export const contentDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.contentDataSources;
})
