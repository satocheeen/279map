import { useSelector } from "react-redux";
import { RootState } from "../configureStore";
import { useMemo } from "react";
import useDataSource from "./useDataSource";

/**
 * カテゴリ関連のユーティリティフック
 */
export default function useCategory() {
    const { visibleDataSourceIds } = useDataSource();
    const originalCategories = useSelector((state: RootState) => state.data.categories);

    /**
     * 表示中のデータソースに紐づくカテゴリに絞る
     */
    const categories = useMemo(() => {
        return originalCategories.filter(category => {
            const isVisibleContent = category.dataSourceIds.some(dataSourceId => {
                return visibleDataSourceIds.includes(dataSourceId);
            });
            return isVisibleContent;
        });
    }, [visibleDataSourceIds, originalCategories]);

    return {
        categories,
    }
}