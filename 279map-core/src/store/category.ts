import { CategoryDefine } from '279map-common';
import { GetCategoryAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from './datasource';
import { apiIdAtom, getAPICallerInstance } from '../api/useApi';

export const categoriesAtom = atom(async(get): Promise<CategoryDefine[]> => {
    try {
        const instanceId = get(apiIdAtom);
        const apiCaller = getAPICallerInstance(instanceId)

        // 表示中のデータソースに紐づくカテゴリを取得
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        const apiResult = await apiCaller.callApi(GetCategoryAPI, {
            dataSourceIds: targetDataSourceIds,
        });

        return apiResult;

    } catch (e) {
        console.warn('loadCategories error', e);
        return [];
    }

})

export const categoriesLoadableAtom = loadable(categoriesAtom);