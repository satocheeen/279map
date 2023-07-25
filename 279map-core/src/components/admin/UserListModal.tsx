import React, { useState, useCallback } from 'react';
import { useMounted } from '../../util/useMounted';
import { addListener, removeListener } from '../../util/Commander';
import { Modal } from '../common';
import styles from './UserListModal.module.scss';

type Props = {
}

export default function UserListModal(props: Props) {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    useMounted(() => {
        const h = addListener('ShowUserList', async() => {
            setShow(true);
        });

        return () => {
            removeListener(h);
        }
    });

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, [])

    const onClosed = useCallback(() => {

    }, []);

    return (
        <Modal show={show} spinner={loading}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                ユーザ一覧
            </Modal.Header>
            <Modal.Body>
                一覧
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}