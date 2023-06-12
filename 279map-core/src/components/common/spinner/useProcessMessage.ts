import { useCallback } from "react";
import { ProcessMessageType, operationActions } from "../../../store/operation/operationSlice";
import { useAppDispatch } from "../../../store/configureStore";

export function useProcessMessage() {
    const dispatch = useAppDispatch();

    const showProcessMessage = useCallback((param: ProcessMessageType) => {
        dispatch(operationActions.showProcessMessage(param));
    }, [dispatch]);

    const hideProcessMessage = useCallback(() => {
        dispatch(operationActions.hideProcessMessage());
    }, [dispatch]);

    return {
        showProcessMessage,
        hideProcessMessage,
    }
}