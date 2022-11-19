import { CategoryDefine } from "279map-common/dist/types";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./configureStore";

/**
 * カテゴリ関連のフック
 */
export function useCategory() {
    const categories = useSelector((state: RootState) => state.data.categories);
    const categoryMap = useMemo(() => {
        const map = new Map<string, CategoryDefine>();
        categories.forEach(category => {
            map.set(category.name, category);
        });
        return map;
    }, [categories]);

    return {
        categoryMap,
    }

}