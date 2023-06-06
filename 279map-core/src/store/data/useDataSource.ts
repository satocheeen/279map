import { useSelector } from "react-redux";
import { RootState } from "../configureStore";
import { useCallback } from 'react';

/**
 * データソース関連のユーティリティフック
 * @returns 
 */
export default function useDataSource() {
    const dataSourceGroups = useSelector((state: RootState) => state.data.dataSourceGroups);

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
        isVisibleDataSource,
    }
}