import { DataSourceGroup, DataSourceInfo } from "279map-common";
import { atom, selector } from "recoil";

/**
 * データソース関連のRecoil
 */

/**
 * データソースグループ
 */
export const dataSourceGroupsState = atom<DataSourceGroup[]>({
    key: 'dataSourceGroupsAtom',
    default: [],
})

/**
 * データソースグループをデータソースにばらしたもの
 */
export const dataSourcesState = selector<DataSourceInfo[]>({
    key: 'dataSourcesSelector',
    get: ({get}) => {
        const groups = get(dataSourceGroupsState);
        return groups.reduce((acc, cur) => {
            return acc.concat(cur.dataSources);
        }, [] as DataSourceInfo[]);
    }
})

/**
 * 表示状態のデータソースID
 */
export const visibleDataSourceIdsState = selector<string[]>({
    key: 'visibleDataSourceIdsSelector',
    get: ( { get } ) => {
        const dataSourceGroups = get(dataSourceGroupsState);
        const idList = [] as string[];
        dataSourceGroups.forEach(group => {
            if (!group.visible) return;
            group.dataSources.forEach(ds => {
                if (!ds.visible) return;
                idList.push(ds.dataSourceId);
            })
        });
        return idList;
    }
})