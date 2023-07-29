import { useCallback, useMemo } from "react";
import { eventsState } from "./dataAtom";
import { useRecoilState, useRecoilValue } from "recoil";
import { useMap } from "../../components/map/useMap";
import { GetEventsAPI } from "tsunagumap-api";
import { dataSourceGroupsState, visibleDataSourceIdsState } from "../datasource";

/**
 * イベント関連のユーティリティフック
 */
export default function useEvent() {
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const [originalEvents, setEvents] = useRecoilState(eventsState);
    const dataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const { getApi } = useMap();

    const loadEvents = useCallback(async() => {
        try {
            const targetDataSourceIds = [] as string[];
            dataSourceGroups.forEach(group => {
                if (!group.visible) return;
                group.dataSources.forEach(ds => {
                    if (ds.visible) {
                        targetDataSourceIds.push(ds.dataSourceId);
                    }
                })
            });
            const apiResult = await getApi().callApi(GetEventsAPI, {
                dataSourceIds: targetDataSourceIds,
            });
            setEvents(apiResult);

            return apiResult;
    
        } catch (e) {
            throw e;
        }

    }, [dataSourceGroups, setEvents, getApi]);

    /**
     * 表示中のデータソースに紐づくイベントに絞る
     */
    const events = useMemo(() => {
        return originalEvents.filter(event => {
            return visibleDataSourceIds.includes(event.dataSourceId);
        });
    }, [visibleDataSourceIds, originalEvents]);

    return {
        events,
        loadEvents,
    }
}