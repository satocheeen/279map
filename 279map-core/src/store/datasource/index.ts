import { atom } from 'jotai';
import { currentMapDefineAtom } from '../session';
import { DatasourceGroup, DatasourceInfo } from '../../graphql/generated/graphql';
import { DataSourceInfo } from '279map-common';

/**
 * データソース関連のRecoil
 */

type DatasourceVisibleInfo = {
    group: {[group: string]: boolean};
    datasource: {[id: string]: boolean};
}
/**
 * データソースの表示・非表示情報
 */
export const dataSourceVisibleState = atom<DatasourceVisibleInfo>({
    group: {},
    datasource: {},
})

/**
 * アイテムデータソースグループ（表示情報付き）
 */
export const itemDataSourceGroupsAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    const dataSourceVisibleInfo = get(dataSourceVisibleState);

    return mapDefine.itemDataSourceGroups.map(group => {
        const groupVisible = dataSourceVisibleInfo.group[group.name ?? ''] ?? group.visible;
        const newValue = Object.assign({}, group);
        newValue.visible = groupVisible;
        newValue.datasources = newValue.datasources.map(ds => {
            const dsVisible = dataSourceVisibleInfo.datasource[ds.datasourceId] ?? ds.visible;
            const newDs = Object.assign({}, ds);
            newDs.visible = dsVisible;
            return newDs;
        });
        return newValue;
    }) as DatasourceGroup[];
})

/**
 * データソースグループをデータソースにばらしたもの
 */
export const itemDataSourcesAtom = atom((get) => {
    const dataSourceGroups = get(itemDataSourceGroupsAtom);
    return dataSourceGroups.reduce((acc, cur) => {
        return acc.concat(cur.datasources as DatasourceInfo[]);
    }, [] as DatasourceInfo[]);
})

/**
 * コンテンツのデータソース一覧
 */
export const contentDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.contentDataSources;
})

export const visibleDataSourceIdsAtom = atom((get) => {
    const dataSourceGroups = get(itemDataSourceGroupsAtom);
    const idList = [] as string[];
    dataSourceGroups.forEach(group => {
        if (!group.visible) return;
        group.datasources.forEach(ds => {
            if (!ds.visible) return;
            idList.push(ds.datasourceId);
        })
    });
    return idList;
})
