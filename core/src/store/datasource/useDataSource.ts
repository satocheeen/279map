import { useCallback } from 'react';
import { dataSourceVisibleAtom, itemDataSourcesAtom, itemDatasourceVisibleListAtom } from '.';
import { useAtomCallback } from 'jotai/utils';
import { DatasourceLocationKindType } from '../../entry';

export type ChangeVisibleLayerTarget = ({
    dataSourceId: string
} | {
    group: string
}) & {
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
        useCallback((get, set, params: ChangeVisibleLayerTarget[]) => {
            const newMap = {} as {[id: string]: boolean};
            for (const param of params) {
                if ('group' in param) {
                    const groupName = param.group;
                    // 当該グループに属するデータソース取得
                    const itemDatasourceVisibleList = get(itemDatasourceVisibleListAtom);
                    const targets = itemDatasourceVisibleList.filter(item => item.groupNames.includes(param.group));
                    for (const ds of targets) {
                        newMap[ds.datasourceId] = param.visible;
                    }
                } else {
                    const ds = param.dataSourceId;
                    newMap[ds] = param.visible;
                }
            }
            set(dataSourceVisibleAtom, current => {
                return Object.assign({}, current, newMap);
            })
        }, [])
    )

    /**
     * 指定のデータソースがアイコン指定可能かどうかを返す
     */
    const isEnableIcon = useAtomCallback(
        useCallback((get, set, datasourceId: string) => {
            const itemDatasources = get(itemDataSourcesAtom);
            const targetDatasource = itemDatasources.find(ds => ds.datasourceId === datasourceId);
            if (!targetDatasource) {
                return false;
            }
            if (targetDatasource?.config.kind === DatasourceLocationKindType.VirtualItem) {
                return true;
            }
            if (targetDatasource?.config.kind === DatasourceLocationKindType.RealItem) {
                return targetDatasource.config.drawableArea;
            }
            return false;

        }, [])
    );

    return {
        updateDatasourceVisible,
        isEnableIcon,
    }
}