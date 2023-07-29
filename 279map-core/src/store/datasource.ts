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
