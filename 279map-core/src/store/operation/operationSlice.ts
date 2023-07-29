import { DataId } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Extent } from "ol/extent";
import { ConfirmParam, ConfirmResult } from "../../components/common/confirm/useConfirm";
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

// オーバーレイ表示時に表示するボタン種別
export enum ButtonInProcess {
    Request = 'Request',    // 地図への登録申請
}
export type ProcessMessageType = {
    overlay: boolean;   // trueの場合、オーバーレイ表示。falseの場合、ユーザ操作を阻害しない位置に表示
    spinner: boolean;   // trueの場合、スピナー表示
    message?: string;
    button?: ButtonInProcess;   // メッセージ下に表示するボタン種別（overlay=trueの場合のみ有効）
}
export type ProcessMessageWithID = ProcessMessageType & {
    id: number;
}
/**
 * 操作関連のデータを管理するストア
 */
const operationSlice = createSlice({
    name: 'operation',
    initialState: {
        // 選択中アイテムID
        selectedItemIds: [] as DataId[],

        // フィルタ
        // filteredItems: null as SearchResult['items'] | null,   // フィルタ条件に該当するコンテンツ。フィルタ未指定の場合は、null。

        mapMode: MapMode.Normal,

        mapView: {
            extent: [0,0,0,0],
            zoom: 0,
        } as ViewInfo,

        processMeesageCounter: 0,
        processMessages: [] as ProcessMessageWithID[],

        // Confirm
        showConfirmDialog: false,
        confirmInfo: undefined as undefined | ConfirmParam,
        confirmResult: undefined as undefined | ConfirmResult,
    },
    reducers: {
        setSelectItem(state, action: PayloadAction<DataId[]>) {
            state.selectedItemIds = action.payload;
        },
        unselectItem(state) {
            if (state.selectedItemIds.length === 0) {
                return;
            }
            state.selectedItemIds = [];
        },
        updateMapView(state, action: PayloadAction<ViewInfo>) {
            state.mapView = action.payload;
        },
        changeMapMode(state, action: PayloadAction<MapMode>) {
            state.mapMode = action.payload;
        },
        addProcessMessage(state, action: PayloadAction<ProcessMessageWithID>) {
            state.processMessages.push(action.payload);
            state.processMeesageCounter = state.processMeesageCounter + 1;
        },
        removeProcessMessage(state, action: PayloadAction<number>) {
            state.processMessages = state.processMessages.filter(item => item.id !== action.payload);
        },
        showConfirmDialog(state, action: PayloadAction<ConfirmParam>) {
            state.showConfirmDialog = true;
            state.confirmInfo = action.payload;
            state.confirmResult = undefined;
        },
        hideConfirmDialog(state, action: PayloadAction<ConfirmResult>) {
            state.showConfirmDialog = false;
            state.confirmInfo = undefined;
            state.confirmResult = action.payload;
        },
    },
})
export const operationActions = operationSlice.actions;
export const operationReducer = operationSlice.reducer;
