import { useCallback } from 'react';
import { dataSourceVisibleState } from '.';
import { useAtom } from 'jotai';

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
    const [_, setDataSourceVisible] = useAtom(dataSourceVisibleState);

    const updateDatasourceVisible = useCallback((param: DataSourceVisibleParam) => {
        if ('group' in param.target) {
            const group = param.target.group ?? '';
            setDataSourceVisible(current => {
                return {
                    group: Object.assign({}, current.group, {
                        [group]: param.visible,
                    }),
                    datasource: current.datasource,
                }
            })
        } else {
            const ds = param.target.dataSourceId;
            setDataSourceVisible(current => {
                return {
                    group: current.group,
                    datasource: Object.assign({}, current.datasource, {
                        [ds]: param.visible,
                    })
                }
            })
        }
    }, [setDataSourceVisible]);

    return {
        updateDatasourceVisible,
    }
}