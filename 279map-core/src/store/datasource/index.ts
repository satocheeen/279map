import { DataSourceGroup, DataSourceInfo } from "279map-common";
import { atom, selector } from "recoil";
import { mapDefineState } from "../session";

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
    key: 'dataSrouceVisibleState',
    default: {
        group: {},
        datasource: {},
    },
})

/**
 * データソースグループ（表示情報付き）
 */
export const dataSourceGroupsState = selector<DataSourceGroup[]>({
    key: 'dataSourceGroupsAtom',
    get: ({ get }) => {
        const mapDefine = get(mapDefineState);
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
    }
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