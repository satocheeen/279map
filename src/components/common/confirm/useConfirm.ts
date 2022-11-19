import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { operationActions } from '../../../store/operation/operationSlice';

export enum ConfirmResult {
    Ok,
    Cancel,
    Yes,
    No,
}
export enum ConfirmBtnPattern {
    OkCancel,
    YesNo,
}
export type ConfirmParam = {
    message: string;
    title?: string;
    btnPattern?: ConfirmBtnPattern;
}

let resolveCallback = null as null | ((value: ConfirmResult | PromiseLike<ConfirmResult>) => void);

export default function useConfirm() {
    const dispatch = useDispatch();
    const confirm = useCallback(async(param: ConfirmParam): Promise<ConfirmResult> => {
        dispatch(operationActions.showConfirmDialog(param));
        return new Promise<ConfirmResult>(resolve => {
            resolveCallback = resolve;
        });
    }, [dispatch]);

    const onConfirm = useCallback((result: ConfirmResult) => {
        if (!resolveCallback) {
            console.warn('no found resolve');
            return;
        }
        resolveCallback(result);
        dispatch(operationActions.hideConfirmDialog(result));
    }, [dispatch])

    return {
        confirm,
        onConfirm,
    }
}