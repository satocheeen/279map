import { useSelector } from "react-redux";
import { RootState } from "../configureStore";
import { useMemo } from "react";
import useDataSource from "./useDataSource";

/**
 * イベント関連のユーティリティフック
 */
export default function useEvent() {
    const { visibleDataSourceIds } = useDataSource();
    const originalEvents = useSelector((state: RootState) => state.data.events);

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
    }
}