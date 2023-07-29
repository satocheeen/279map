import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { categoryState } from "./dataAtom";
import { visibleDataSourceIdsState } from "../datasource";

/**
 * カテゴリ関連のユーティリティフック
 */
export default function useCategory() {
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const originalCategories = useRecoilValue(categoryState);

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