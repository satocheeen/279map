import { useCallback } from "react";
import { ProcessMessageType, operationActions } from "../../../store/operation/operationSlice";
import { RootState, useAppDispatch } from "../../../store/configureStore";
import { useSelector } from "react-redux";

export function useProcessMessage() {
    const dispatch = useAppDispatch();
    const currentProcessCnt = useSelector((state: RootState) => state.operation.processMeesageCounter);

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

    const hideProcessMessage = useCallback((id: number) => {
        dispatch(operationActions.removeProcessMessage(id));
    }, [dispatch]);

    return {
        showProcessMessage,
        hideProcessMessage,
    }
}