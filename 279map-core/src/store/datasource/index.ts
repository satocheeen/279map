import { atom } from 'jotai';
import { DataSourceInfo, DataSourceKindType, MapKind } from '279map-common';
import { currentMapDefineAtom, currentMapKindAtom } from '../session';

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
 * データソースグループ（表示情報付き）
 */
const dataSourceGroupsAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    const dataSourceVisibleInfo = get(dataSourceVisibleState);

    return mapDefine.dataSourceGroups.map(group => {
        const groupVisible = dataSourceVisibleInfo.group[group.name ?? ''] ?? group.visible;
        const newValue = Object.assign({}, group);
        newValue.visible = groupVisible;
        newValue.dataSources = newValue.dataSources.map(ds => {
            const dsVisible = dataSourceVisibleInfo.datasource[ds.dataSourceId] ?? ds.visible;
            const newDs = Object.assign({}, ds);
            newDs.visible = dsVisible;
            return newDs;
        });
        return newValue;
    })
})

/**
 * データソースグループをデータソースにばらしたもの
 */
export const dataSourcesAtom = atom((get) => {
    const dataSourceGroups = get(dataSourceGroupsAtom);
    return dataSourceGroups.reduce((acc, cur) => {
        return acc.concat(cur.dataSources);
    }, [] as DataSourceInfo[]);
})

/**
 * アイテムのデータソース
 */
export const itemDataSourcesAtom = atom((get) => {
    const mapKind = get(currentMapKindAtom);
    if (!mapKind) return [];
    const dataSourceGroups = get(dataSourceGroupsAtom);

    // コンテンツのみのデータソースは除外する
    return dataSourceGroups.map(group => {
        const newDataSources = group.dataSources.filter(ds => {
            return ds.itemContents.kind !== DataSourceKindType.Content;
        });
        return Object.assign({}, group, {
            dataSources: newDataSources,
        });
    })
})

export const visibleDataSourceIdsAtom = atom((get) => {
    const dataSourceGroups = get(dataSourceGroupsAtom);
    const idList = [] as string[];
    dataSourceGroups.forEach(group => {
        if (!group.visible) return;
        group.dataSources.forEach(ds => {
            if (!ds.visible) return;
            idList.push(ds.dataSourceId);
        })
    });
    return idList;
})
