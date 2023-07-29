import { DataId } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Extent } from "ol/extent";
import { MapMode } from "../../types/types";

type ViewInfo = {
    extent: Extent;
    zoom: number | undefined;
}
export type PopupTarget = {
    // 指定のアイテムが持つコンテンツ全てを表示する場合
    type: 'item';
    itemId: DataId;
    force?: boolean;   // trueの場合、コンテンツが存在しなくても、ポップアップ表示する（情報登録リンクを表示）
} | {
    // 特定のコンテンツのみ表示する場合
    type: 'content';
    contentId: DataId;
}

/**
 * 操作関連のデータを管理するストア
 */
const operationSlice = createSlice({
    name: 'operation',
    initialState: {
        mapView: {
            extent: [0,0,0,0],
            zoom: 0,
        } as ViewInfo,

    },
    reducers: {
        updateMapView(state, action: PayloadAction<ViewInfo>) {
            state.mapView = action.payload;
        },
    },
})
export const operationActions = operationSlice.actions;
export const operationReducer = operationSlice.reducer;
