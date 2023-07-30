import { selector } from 'recoil';
import { CategoryDefine } from '279map-common';
import { instanceIdState } from './map';
import { getAPICallerInstance } from '../api/ApiCaller';
import { visibleDataSourceIdsState } from './datasource';
import { GetCategoryAPI } from 'tsunagumap-api';

export const categoryState = selector<CategoryDefine[]>({
    key: 'categoryState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
            const apiCaller = getAPICallerInstance(instanceId)

            // 表示中のデータソースに紐づくカテゴリを取得
            const targetDataSourceIds = get(visibleDataSourceIdsState);
            const apiResult = await apiCaller.callApi(GetCategoryAPI, {
                dataSourceIds: targetDataSourceIds,
            });

            return apiResult;
    
        } catch (e) {
            console.warn('loadCategories error', e);
            return [];
        }

    }
})
