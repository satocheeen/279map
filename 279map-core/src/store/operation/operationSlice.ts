import { DataId, MapKind } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Extent } from "ol/extent";
import { ConfirmParam, ConfirmResult } from "../../components/common/confirm/useConfirm";
import { MapMode } from "../../types/types";
import { loadMapDefine } from "../session/sessionThunk";
import { search } from "./operationThunk";

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
export type ProcessMessageType = {
    overlay: boolean;   // trueの場合、オーバーレイ表示。falseの場合、ユーザ操作を阻害しない位置に表示
    spinner: boolean;   // trueの場合、スピナー表示
    message?: string;
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
        filteredContents: null as DataId[] | null,   // フィルタ条件に該当するコンテンツ。フィルタ未指定の場合は、null。

        mapMode: MapMode.Normal,

        mapView: {
            extent: [0,0,0,0],
            zoom: 0,
        } as ViewInfo,

        processMessage: undefined as undefined | ProcessMessageType,

        // // Overlay表示。spinner=trueまたはmessageに値がある場合に、オーバーレイ表示する
        // overlay: {
        //     spinner: false,
        //     message: undefined as string | undefined,
        // },

        // Confirm
        showConfirmDialog: false,
        confirmInfo: undefined as undefined | ConfirmParam,
        confirmResult: undefined as undefined | ConfirmResult,
    },
    reducers: {
        setSelectItem(state, action: PayloadAction<DataId[]>) {
            if (JSON.stringify(state.selectedItemIds) === JSON.stringify(action.payload)) {
                return;
            }
            state.selectedItemIds = action.payload;
        },
        unselectItem(state) {
            if (state.selectedItemIds.length === 0) {
                return;
            }
            state.selectedItemIds = [];
        },
        clearFilter(state) {
            state.filteredContents = null;
        },
        updateMapView(state, action: PayloadAction<ViewInfo>) {
            state.mapView = action.payload;
        },
        // kickCommand(state, action: PayloadAction<CommandSet>) {
        //     state.kickCommand = action.payload;
        // },
        // commandリスナーがコマンド実行したらこれを呼ぶ
        // commandKicked(state) {
        //     state.kickCommand = undefined;
        // },
        changeMapMode(state, action: PayloadAction<MapMode>) {
            state.mapMode = action.payload;
        },
        showProcessMessage(state, action: PayloadAction<ProcessMessageType>) {
            state.processMessage = action.payload;
        },
        hideProcessMessage(state) {
            state.processMessage = undefined;
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
    extraReducers: (builder) => {
        builder
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            state.filteredContents = null;
        })
        .addCase(search.fulfilled, (state, action) => {
            state.filteredContents = action.payload.contents;
        })
    }
})
export const operationActions = operationSlice.actions;
export const operationReducer = operationSlice.reducer;
