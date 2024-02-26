import { atom } from 'jotai';
import { currentMapDefineAtom } from '../session';

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

type DatasourceVisible = {
    type: 'datasource';
    datasourceId: string;
    visible: boolean;
}
type DatasourceVisibleGroup = {
    type: 'group';
    groupName: string;
    visible: boolean;
    datasources: DatasourceVisible[];
}
export type ItemDatasourceVisibleList = (DatasourceVisibleGroup|DatasourceVisible)[];

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
        const datasources = itemDatasourceVisibleList.filter(ds => ds.groupName === groupName);
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

    return [...groups, ...noGroupDsList];
})

/**
 * コンテンツのデータソース一覧
 */
export const contentDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.contentDataSources;
})
