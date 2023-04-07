import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { operationActions } from "../../../store/operation/operationSlice";

export function useSpinner() {
    const dispatch = useDispatch();

    const showSpinner = useCallback((message: string) => {
        dispatch(operationActions.showSpinner({
            show: true,
            message,
        }));
    }, [dispatch]);

    const hideSpinner = useCallback(() => {
        dispatch(operationActions.showSpinner({
            show: false,
        }));
    }, [dispatch]);

    return {
        showSpinner,
        hideSpinner,
    }
}