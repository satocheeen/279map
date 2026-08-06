import { useCallback } from "react";
import { ConfirmParam, ConfirmResult } from "./types";
import { useAtom } from "jotai";
import { confirmInfoAtom, confirmResultAtom, showConfirmDialogAtom } from "./atoms";


let resolveCallback = null as null | ((value: ConfirmResult | PromiseLike<ConfirmResult>) => void);

export default function useConfirm() {
    const [ showConfirmDialog, setShowConfirmDialog ] = useAtom(showConfirmDialogAtom);
    const [ confirmInfo, setConfirmInfo ] = useAtom(confirmInfoAtom);
    const [ confirmResult, setConfirmResult ] = useAtom(confirmResultAtom);

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