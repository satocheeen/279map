import { EventDefine } from "279map-common";
import { instanceIdAtom } from './session';
import { getAPICallerInstance } from '../api/ApiCaller';
import { GetEventsAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from "./datasource";

export const eventsAtom = atom(async(get): Promise<EventDefine[]> => {
    try {
        const instanceId = get(instanceIdAtom);
        const apiCaller = getAPICallerInstance(instanceId);

        // 表示中のデータソースに紐づくイベントを取得
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        const apiResult = await apiCaller.callApi(GetEventsAPI, {
            dataSourceIds: targetDataSourceIds,
        });

        return apiResult;

    } catch (e) {
        console.warn('loadEvents error', e);
        return [];
    }

})

export const eventsLoadableAtom = loadable(eventsAtom);