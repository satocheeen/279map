import React, { useCallback, useMemo } from 'react';
import Button from '../button/Button';
import Modal from '../modal/Modal';
import useConfirm, { ConfirmBtnPattern, ConfirmResult, confirmInfoState, showConfirmDialogState } from './useConfirm';
import styles from './ConfirmDialog.module.scss';
import { usePrevious } from '../../../util/usePrevious';
import { useRecoilValue } from 'recoil';

export default function ConfirmDialog() {
    const isShow = useRecoilValue(showConfirmDialogState);
    const originalConfirmInfo = useRecoilValue(confirmInfoState);
    const prevOriginalConfirmInfo = usePrevious(originalConfirmInfo);

    const confirmInfo = useMemo(() => {
        if (isShow) {
            return originalConfirmInfo;
        } else {
            // Modalがhideされるタイミングで、少し間があるので、その間にメッセージ表示されるように対処
            return prevOriginalConfirmInfo;
        }
    }, [isShow, originalConfirmInfo, prevOriginalConfirmInfo]);

    const message = useMemo(() => confirmInfo?.message, [confirmInfo]);
    const title = useMemo(() => {
        return confirmInfo?.title ? confirmInfo.title : '確認';
    }, [confirmInfo]);
    const btnPattern = useMemo(() => {
        return confirmInfo?.btnPattern ? confirmInfo.btnPattern : ConfirmBtnPattern.OkCancel;
    }, [confirmInfo]);

    const confirmHook = useConfirm();

    const okBtnLabel = useMemo(() => {
        switch(btnPattern) {
            case ConfirmBtnPattern.YesNo:
                return 'はい';
            default:
                return 'OK';
        }
    }, [btnPattern]);

    const cancelBtnLabel = useMemo(() => {
        switch(btnPattern) {
            case ConfirmBtnPattern.YesNo:
                return 'いいえ';
            default:
                return 'Cancel';
        }
    }, [btnPattern]);

    const onOk = useCallback(() => {
        switch(btnPattern) {
            case ConfirmBtnPattern.YesNo:
                confirmHook.onConfirm(ConfirmResult.Yes);
                break;
            default:
                confirmHook.onConfirm(ConfirmResult.Ok);
                break;
        }

    }, [btnPattern, confirmHook]);

    const onCancel = useCallback(() => {
        switch(btnPattern) {
            case ConfirmBtnPattern.YesNo:
                confirmHook.onConfirm(ConfirmResult.No);
                break;
            default:
                confirmHook.onConfirm(ConfirmResult.Cancel);
                break;
        }

    }, [btnPattern, confirmHook]);

    const onCloseBtnClicked = useCallback(() => {
        confirmHook.onConfirm(ConfirmResult.Cancel);

    }, [confirmHook]);

    return (
        <Modal show={isShow} onCloseBtnClicked={onCloseBtnClicked}>
            <Modal.Header>
                {title}
            </Modal.Header>
            <Modal.Body>
                <div className={styles.body}>
                    {message}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onOk}>
                    {okBtnLabel}
                </Button>
                {btnPattern !== ConfirmBtnPattern.OkOnly &&
                    <Button variant="secondary" onClick={onCancel}>
                        {cancelBtnLabel}
                    </Button>
                }
            </Modal.Footer>
        </Modal>
    );
}