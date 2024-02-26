import { useCallback } from 'react';
import { dataSourceVisibleAtom, itemDatasourcesWithVisibleAtom } from '.';
import { useAtomCallback } from 'jotai/utils';

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
    /**
     * データソースの表示状態を更新する
     */
    const updateDatasourceVisible = useAtomCallback(
        useCallback((get, set, param: DataSourceVisibleParam) => {
            if ('group' in param.target) {
                const groupName = param.target.group;
                // 当該グループに属するデータソース取得
                const itemDatasourceVisibleList = get(itemDatasourcesWithVisibleAtom);
                const hit = itemDatasourceVisibleList.find(item => item.type === 'group' && item.groupName === groupName);
                if (!hit) {
                    console.warn('group not exist', groupName);
                    return;
                }
                const newMap = {} as {[id: string]: boolean};
                if (hit.type === 'group') {
                    for (const ds of hit.datasources) {
                        newMap[ds.datasourceId] = param.visible;
                    }

                }
                set(dataSourceVisibleAtom, current => {
                    return Object.assign({}, current, newMap);
                })
            } else {
                const ds = param.target.dataSourceId;
                set(dataSourceVisibleAtom, current => {
                    return Object.assign({}, current, {
                        [ds]: param.visible,
                    });
                })
            }
        }, [])
    )

    return {
        updateDatasourceVisible,
    }
}