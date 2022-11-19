/**
 * Hook of Datas
 */

import { useSelector } from "react-redux";
import { RootState } from "../configureStore";
import { useMemo } from 'react';
import { ContentsDefine } from "279map-common/dist/types";

export default function useData() {
    const contentsList = useSelector((state: RootState) => state.data.contentsList);

    // key = contentId, value = content のマップ
    const contentsMap = useMemo(() => {
        const map = new Map<string, ContentsDefine>();
        contentsList.forEach(content => {
            map.set(content.id, content);
            content.children?.forEach(child => {
                map.set(child.id, child);
            });
        });
        return map;
    }, [contentsList]);

    // key = itemId, value = contents のマップ
    const itemContentsMap = useMemo(() => {
        const map = new Map<string, ContentsDefine>();
        contentsList.forEach(content => {
            map.set(content.itemId, content);
        });
        return map;
    }, [contentsList]);
    
    return {
        contentsMap,
        itemContentsMap,
    }
}