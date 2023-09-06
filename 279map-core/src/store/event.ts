import { EventDefine } from "279map-common";
import { GetEventsAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from "./datasource";
import { connectStatusAtom, serverInfoAtom } from "./session";
import { callApi } from "../api/api";

export const eventsAtom = atom(async(get): Promise<EventDefine[]> => {
    try {
        const serverInfo = get(serverInfoAtom);
        const sid = (await get(connectStatusAtom)).sid;

        // 表示中のデータソースに紐づくイベントを取得
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        const apiResult = await callApi(serverInfo, sid, GetEventsAPI, {
            dataSourceIds: targetDataSourceIds,
        });

        return apiResult;

    } catch (e) {
        console.warn('loadEvents error', e);
        return [];
    }

})

export const eventsLoadableAtom = loadable(eventsAtom);