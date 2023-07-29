import { useCallback } from "react";
import { atom, useSetRecoilState } from "recoil";

export const showConfirmDialogState = atom<boolean>({
    key: 'showConfirmDialogAtom',
    default: false,
});

export const confirmInfoState = atom<undefined | ConfirmParam>({
    key: 'confirmInfoAtom',
    default: undefined,
});

export const confirmResultState = atom<undefined | ConfirmResult>({
    key: 'confirmResultAtom',
    default: undefined,
});

export enum ConfirmResult {
    Ok,
    Cancel,
    Yes,
    No,
}
export enum ConfirmBtnPattern {
    OkCancel,
    OkOnly,
    YesNo,
}
export type ConfirmParam = {
    message: string;
    title?: string;
    btnPattern?: ConfirmBtnPattern;
}

let resolveCallback = null as null | ((value: ConfirmResult | PromiseLike<ConfirmResult>) => void);

export default function useConfirm() {
    const setShowConfirmDialog = useSetRecoilState(showConfirmDialogState);
    const setConfirmInfo = useSetRecoilState(confirmInfoState);
    const setConfirmResult = useSetRecoilState(confirmResultState);

    const confirm = useCallback(async(param: ConfirmParam): Promise<ConfirmResult> => {
        setShowConfirmDialog(true);
        setConfirmInfo(param);
        setConfirmResult(undefined);

        return new Promise<ConfirmResult>(resolve => {
            resolveCallback = resolve;
        });
    }, [setShowConfirmDialog, setConfirmInfo, setConfirmResult]);

    const onConfirm = useCallback((result: ConfirmResult) => {
        if (!resolveCallback) {
            console.warn('no found resolve');
            return;
        }
        resolveCallback(result);
        setShowConfirmDialog(false);
        setConfirmInfo(undefined);
        setConfirmResult(result);
    }, [setShowConfirmDialog, setConfirmInfo, setConfirmResult]);

    return {
        confirm,
        onConfirm,
    }
}