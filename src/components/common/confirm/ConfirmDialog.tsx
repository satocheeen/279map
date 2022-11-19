import React, { useCallback, useMemo } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import useConfirm, { ConfirmBtnPattern, ConfirmResult } from './useConfirm';
import styles from './ConfirmDialog.module.scss';

export default function ConfirmDialog() {
    const isShow = useSelector((state: RootState) => state.operation.showConfirmDialog);
    const confirmInfo = useSelector((state: RootState) => state.operation.confirmInfo);
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

    return (
        <Modal show={isShow}>
            <Modal.Header>
                <Modal.Title>{title}</Modal.Title>
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
                <Button variant="secondary" onClick={onCancel}>
                    {cancelBtnLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}