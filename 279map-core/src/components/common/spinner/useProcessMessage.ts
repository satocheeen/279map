import { useCallback } from "react";
import { ProcessMessageType, operationActions } from "../../../store/operation/operationSlice";
import { RootState, useAppDispatch } from "../../../store/configureStore";
import { useSelector } from "react-redux";

export function useProcessMessage() {
    const dispatch = useAppDispatch();
    const currentProcessCnt = useSelector((state: RootState) => state.operation.processMeesageCounter);
    
    /**
     * オーバーレイ表示するかどうか
     */
    const isShowOverlay = useSelector((state: RootState) => {
        return state.operation.processMessages.some(pm => pm.overlay);
    });

    /**
     * スピナー表示するかどうか
     */
    const isShowSpinner = useSelector((state: RootState) => {
        return state.operation.processMessages.some(pm => pm.spinner);
    });

    /**
     * 表示するメッセージ。メッセージが存在しない場合は、undefined。
     */
    const processMessage = useSelector((state: RootState) => {
        const message = state.operation.processMessages.find(pm => pm.message);
        return message?.message;
    });


    /**
     * 指定の処理中メッセージを画面に表示する
     * @return id。メッセージを消す際にhideProcessに渡す。
     */
    const showProcessMessage = useCallback((param: ProcessMessageType): number => {
        console.log('showProcessMessage', param);
        // キー発行
        const id = currentProcessCnt + 1;

        const withID = Object.assign({}, param, {
            id,
        });

        dispatch(operationActions.addProcessMessage(withID));
        return id;
    }, [dispatch, currentProcessCnt]);

    /**
     * 表示中のメッセージを消す
     * @param id showProcessMessageで返されたid
     */
    const hideProcessMessage = useCallback((id: number) => {
        dispatch(operationActions.removeProcessMessage(id));
    }, [dispatch]);

    return {
        showProcessMessage,
        hideProcessMessage,
        isShowOverlay,
        isShowSpinner,
        processMessage,
    }
}