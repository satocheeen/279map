import React, { useState, useCallback } from 'react';
import { useMounted } from '../../util/useMounted';
import { addListener, removeListener } from '../../util/Commander';
import { Modal } from '../common';
import styles from './UserListModal.module.scss';
import { useMap } from '../map/useMap';
import { GetUserListAPI } from 'tsunagumap-api';
import { useWatch } from '../../util/useWatch';

export default function UserListModal() {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const { getApi } = useMap();

    useMounted(() => {
        const h = addListener('ShowUserList', async() => {
            setShow(true);
        });
        
        return () => {
            removeListener(h);
        }
    });

    useWatch(() => {
        if (!show) return;

        setLoading(true);
        getApi().callApi(GetUserListAPI, undefined)
        .then(result => {
            console.log('users', result.users);
        })
        .catch((e) => {
            console.warn(e);
        })
        .finally(() => {
            setLoading(false);
        })

    }, [show])

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