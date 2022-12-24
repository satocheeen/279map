import { MapKind } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Extent } from "ol/extent";
import { ConfirmParam, ConfirmResult } from "../../components/common/confirm/useConfirm";
import { MapMode } from "../../types/types";
import { loadMapDefine } from "../session/sessionThunk";

export type FilterDefine = {
    type: 'category';
    categoryName: string;
} | {
    type: 'calendar';
    date: string;   // Date.toLocaleDateString()
}
type ViewInfo = {
    extent: Extent;
    zoom: number | undefined;
}
export type PopupTarget = {
    // 指定のアイテムが持つコンテンツ全てを表示する場合
    type: 'item';
    itemId: string;
    force?: boolean;   // trueの場合、コンテンツが存在しなくても、ポップアップ表示する（情報登録リンクを表示）
} | {
    // 特定のコンテンツのみ表示する場合
    type: 'content';
    contentId: string;
}
type TooltipParam = {
    anchorId: string;
    content: string;
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
        focusItemId: null as string | null,

        // 選択中アイテムID
        selectedItemIds: [] as string[],

        // // ポップアップを開いて表示する対象一覧
        // popupTargets: [] as PopupTarget[],

        filter: [] as FilterDefine[],
        mapMode: MapMode.Normal,

        mapView: {
            extent: [0,0,0,0],
            zoom: 0,
        } as ViewInfo,

        // Spinner
        showSpinner: false,
        spinnerMessage: '',

        // Confirm
        showConfirmDialog: false,
        confirmInfo: undefined as undefined | ConfirmParam,
        confirmResult: undefined as undefined | ConfirmResult,

        // Tooltip
        tooltip: null as TooltipParam | null,
    },
    reducers: {
        setMapKind(state, action: PayloadAction<MapKind>) {
            state.currentMapKind = action.payload;
        },
        setFocusItemId(state, action: PayloadAction<string|null>) {
            state.focusItemId = action.payload;
        },
        setSelectItem(state, action: PayloadAction<string[]>) {
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
        // setPopup(state, action: PayloadAction<PopupTarget[]>) {
        //     state.popupTargets = action.payload;
        // },
        // clearPopup(state) {
        //     state.popupTargets = [];
        // },
        setFilter(state, action: PayloadAction<FilterDefine[]>) {
            state.filter = action.payload;
        },
        clearFilter(state) {
            state.filter = [];
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
        showSpinner(state, action: PayloadAction<{show: true; message?: string} | { show: false }>) {
            state.showSpinner = action.payload.show;
            if (action.payload.show) {
                state.spinnerMessage = action.payload.message ? action.payload.message : '';
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
        setTooltip(state, action: PayloadAction<TooltipParam>) {
            state.tooltip = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            state.filter = [];
            // state.popupTargets = [];
        })
    }
})
export const operationActions = operationSlice.actions;
export const operationReducer = operationSlice.reducer;
