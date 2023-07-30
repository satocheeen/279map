import { useCallback, useMemo } from 'react';
import { useRecoilState } from "recoil";
import { DataSourceInfo } from "279map-common";
import { dataSourceGroupsState } from '.';

type DataSourceVisibleParam = {
    target: {
        dataSourceId: string
    } | {
        group: string
    },
    visible: boolean
}
/**
 * データソース関連のユーティリティフック
 * @returns 
 */
export default function useDataSource() {
    const [ dataSourceGroups, setDataSourceGroups] = useRecoilState(dataSourceGroupsState);

    const updateDatasourceVisible = useCallback((param: DataSourceVisibleParam) => {
        setDataSourceGroups(current => {
            return current.map(group => {
                const visible = ('group' in param.target && param.target.group === group.name) ? param.visible : group.visible;
                return {
                    name: group.name,
                    dataSources: group.dataSources.map((ds): DataSourceInfo => {
                        const dsVisible = ('dataSourceId' in param.target && param.target.dataSourceId === ds.dataSourceId) ? param.visible : ds.visible;
                        return Object.assign({}, ds, {
                            visible: dsVisible,
                        });
                    }),
                    visible,
                }
            })
        })
    }, [setDataSourceGroups]);

    const isVisibleDataSource = useCallback((dataSourceId: string) => {
        for (const group of dataSourceGroups) {
            const ds = group.dataSources.find(ds => ds.dataSourceId === dataSourceId);
            if (!ds) continue;

            // 属するグループが非表示なら非表示
            if (!group.visible) return false;

            return ds.visible;
        }
        return false;
    }, [dataSourceGroups]);

    return {
        updateDatasourceVisible,
        isVisibleDataSource,
    }
}