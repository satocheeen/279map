import { CategoryDefine } from '279map-common';
import { GetCategoryAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from './datasource';
import { connectStatusAtom, serverInfoAtom } from './session';
import { callApi } from '../api/api';

export const categoriesAtom = atom(async(get): Promise<CategoryDefine[]> => {
    try {
        const serverInfo = get(serverInfoAtom);
        const sid = (await get(connectStatusAtom)).sid;

        // 表示中のデータソースに紐づくカテゴリを取得
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        const apiResult = await callApi(serverInfo, sid, GetCategoryAPI, {
            dataSourceIds: targetDataSourceIds,
        });

        return apiResult;

    } catch (e) {
        console.warn('loadCategories error', e);
        return [];
    }

})

export const categoriesLoadableAtom = loadable(categoriesAtom);