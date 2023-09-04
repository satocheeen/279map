import { EventDefine } from "279map-common";
import { GetEventsAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from "./datasource";
import { getAPICallerInstance } from "../api/useApi";
import { instanceIdAtom } from "./session";

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