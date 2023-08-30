import { atom } from 'jotai';
import { DataSourceInfo, MapKind } from '../../entry';
import { mapDefineAtom } from '../session';

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
    const mapDefine = get(mapDefineAtom);
    const dataSourceVisibleInfo = get(dataSourceVisibleState);
    console.log('debug mapDefine', mapDefine);

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
    const mapDefine = get(mapDefineAtom);
    const mapKind = mapDefine.mapKind;
    const dataSourceGroups = get(dataSourceGroupsAtom);

    // コンテンツのみのデータソースは除外する
    return dataSourceGroups.map(group => {
        const newDataSources = group.dataSources.filter(ds => {
            if (mapKind === MapKind.Real) {
                return ds.itemContents.RealItem || ds.itemContents.Track;
            } else {
                return ds.itemContents.VirtualItem;
            }
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
