import { createAsyncThunk } from "@reduxjs/toolkit";
import { loadContents } from "../../store/data/dataThunk";
import { operationActions, PopupTarget } from "../../store/operation/operationSlice";

/**
 * Thunk of Popup Operations
 * ポップアップ関連のThunk
 */

/**
 * Open items' popups
 * 指定のアイテムIDのコンテンツをポップアップ表示する
 */
 export const openItemContentsPopup = createAsyncThunk<void, PopupTarget[]>(
    'popup/openItemContentsPopupStatus',
    async(param, { rejectWithValue, dispatch }) => {
        // try {
        //     dispatch(operationActions.clearPopup());

        //     // 指定のIDに紐づくコンテンツ情報をロード
        //     await dispatch(loadContents({
        //         targets: param
        //     }));
    
        //     // ポップアップ表示対象として設定するコンテンツを更新する
        //     console.log('target', param);
        //     dispatch(operationActions.setPopup(param));
    
        // } catch(e) {
        //     console.warn('openItemContentsPopup error', e);
        //     return rejectWithValue(e);

        // }
    }
);

/**
 * 指定のアイテムのポップアップを開く
 * @param force trueの場合、コンテンツが存在しなくても、ポップアップ表示する（情報登録リンクを表示）
 */
export const openItemPopup = createAsyncThunk<void, {itemIds: string[], force?: boolean}>(
    'popup/openItemPopupStatus',
    async(target, { rejectWithValue, dispatch }) => {
        try {
            const param = target.itemIds.map(itemId => {
                return {
                    type: 'item',
                    itemId,
                    force: target.force ?? false,
                } as PopupTarget;
            })
            await dispatch(openItemContentsPopup(param));
    
        } catch(e) {
            console.warn('openItemPopup error', e);
            return rejectWithValue(e);

        }
    }
)

/**
 * 指定のコンテンツのポップアップを開く
 */
export const openContentPopup = createAsyncThunk<void, string[]>(
    'popup/openContentPopup',
    async(contentIds, { rejectWithValue, dispatch }) => {
        try {
            const param = contentIds.map(target => {
                return {
                    type: 'content',
                    contentId: target,
                }as PopupTarget;
            });
            await dispatch(openItemContentsPopup(param));
    
        } catch(e) {
            console.warn('openContentPopup error', e);
            return rejectWithValue(e);

        }
    }
)