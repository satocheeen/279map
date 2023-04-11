/**
 * Hook of Datas
 */

import { useSelector } from "react-redux";
import { RootState } from "../configureStore";
import { useMemo } from 'react';
import { ContentsDefine, DataId } from "../../279map-common";

function getMapKey(id: DataId): string {
    return id.id + '-' + id.dataSourceId;
}
export default function useData() {
    const contentsList = useSelector((state: RootState) => state.data.contentsList);

    // key = contentId - contentDataSourceId, value = content のマップ
    const contentsMap = useMemo(() => {
        const map = new Map<string, ContentsDefine>();
        contentsList.forEach(content => {
            const key = getMapKey(content.id);
            map.set(key, content);
            content.children?.forEach(child => {
                const childKey = getMapKey(child.id);
                map.set(childKey, child);
            });
        });
        return map;
    }, [contentsList]);

    // key = itemId, value = contents のマップ
    const itemContentsMap = useMemo(() => {
        const map = new Map<string, ContentsDefine>();
        contentsList.forEach(content => {
            const key = getMapKey(content.itemId);
            map.set(key, content);
        });
        return map;
    }, [contentsList]);
    
    return {
        // contentsMap,
        // itemContentsMap,
    }
}