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
type TooltipParam = {
    anchorId: string;
    content: DataId;
    modal?: boolean;    // set true when the tooltip on the dialog
}

/**
 * 操作関連のデータを管理するストア
 */
const operationSlice = createSlice({
    name: 'operation',
    initialState: {
        // 表示する地図種別を指定（この値を変更すると、地図種別が切り替わる）
        currentMapKind: null as MapKind | null,
        // フォーカスするアイテムを指定
        focusItemId: null as DataId | null,

        // 選択中アイテムID
        selectedItemIds: [] as DataId[],

        // フィルタ
        filteredContents: null as DataId[] | null,   // フィルタ条件に該当するコンテンツ。フィルタ未指定の場合は、null。

        mapMode: MapMode.Normal,

        mapView: {
            extent: [0,0,0,0],
            zoom: 0,
        } as ViewInfo,

        // Overlay。spinner=trueまたはmessageに値がある場合に、オーバーレイ表示する
        overlay: {
            spinner: false,
            message: undefined as string | undefined,
        },

        // Confirm
        showConfirmDialog: false,
        confirmInfo: undefined as undefined | ConfirmParam,
        confirmResult: undefined as undefined | ConfirmResult,
    },
    reducers: {
        setMapKind(state, action: PayloadAction<MapKind>) {
            state.currentMapKind = action.payload;
        },
        setFocusItemId(state, action: PayloadAction<DataId|null>) {
            state.focusItemId = action.payload;
        },
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
        showOverlay(state, action: PayloadAction<{spinner: boolean; message?: string}>) {
            state.overlay = {
                spinner: action.payload.spinner,
                message: action.payload.message,
            };
        },
        hideOverlay(state) {
            state.overlay = {
                spinner: false,
                message: undefined,
            }
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
