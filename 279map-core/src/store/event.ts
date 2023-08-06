import { selector } from 'recoil';
import { EventDefine } from "279map-common";
import { instanceIdState } from './session';
import { getAPICallerInstance } from '../api/ApiCaller';
import { visibleDataSourceIdsState } from './datasource';
import { GetEventsAPI } from 'tsunagumap-api';

export const eventState = selector<EventDefine[]>({
    key: 'eventState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
            const apiCaller = getAPICallerInstance(instanceId);

            // 表示中のデータソースに紐づくイベントを取得
            const targetDataSourceIds = get(visibleDataSourceIdsState);
            const apiResult = await apiCaller.callApi(GetEventsAPI, {
                dataSourceIds: targetDataSourceIds,
            });

            return apiResult;
    
        } catch (e) {
            console.warn('loadEvents error', e);
            return [];
        }
    },
})