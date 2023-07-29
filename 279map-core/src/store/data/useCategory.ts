import { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { categoryState } from "./dataAtom";
import { useMap } from "../../components/map/useMap";
import { GetCategoryAPI } from "tsunagumap-api";
import { dataSourceGroupsState, visibleDataSourceIdsState } from "../datasource";

/**
 * カテゴリ関連のユーティリティフック
 */
export default function useCategory() {
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const [originalCategories, setCateogories] = useRecoilState(categoryState);
    const dataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const { getApi } = useMap();

    const loadCategories = useCallback(async() => {
        try {
            const targetDataSourceIds = [] as string[];
            dataSourceGroups.forEach(group => {
                if (!group.visible) return;
                group.dataSources.forEach(ds => {
                    if (ds.visible) {
                        targetDataSourceIds.push(ds.dataSourceId);
                    }
                })
            })
            const apiResult = await getApi().callApi(GetCategoryAPI, {
                dataSourceIds: targetDataSourceIds.length > 0 ? targetDataSourceIds : undefined,
            });

            setCateogories(apiResult);
    
        } catch (e) {
            console.warn('loadEvents error', e);
            throw e;
        }

    }, [dataSourceGroups, getApi, setCateogories]);

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
        loadCategories,
    }
}