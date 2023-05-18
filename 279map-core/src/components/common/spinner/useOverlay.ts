import { useCallback } from "react";
import { operationActions } from "../../../store/operation/operationSlice";
import { useAppDispatch } from "../../../store/configureStore";

export function useOverlay() {
    const dispatch = useAppDispatch();

    const showSpinner = useCallback((message: string) => {
        dispatch(operationActions.showOverlay({
            spinner: true,
            message,
        }));
    }, [dispatch]);

    const hideSpinner = useCallback(() => {
        dispatch(operationActions.hideOverlay());
    }, [dispatch]);

    const showOverlayMessage = useCallback((message: string) => {
        dispatch(operationActions.showOverlay({
            spinner: false,
            message,
        }));
    }, [dispatch]);

    return {
        showSpinner,
        hideSpinner,
        showOverlayMessage,
    }
}