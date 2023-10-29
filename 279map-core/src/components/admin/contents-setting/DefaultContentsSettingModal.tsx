import React, { useState } from 'react';
import { Button, Modal } from '../../common';
import styles from './DefaultContentsSettingModal.module.scss';
import CurrentContentsListPage from './CurrentContentsListPage';
import AddableContentsListPage from './AddableContentsListPage';

type Props = {
    onClose: () => void;
}

export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
    const [page, setPage] = useState<'current'|'add'>('current'); 

    return (
        <Modal show={show}
            onCloseBtnClicked={() => setShow(false)}
            onClosed={props.onClose}
            >
            <Modal.Header>
                コンテンツ設定
            </Modal.Header>
            <Modal.Body>
                {page === 'current' ?
                    <CurrentContentsListPage />
                    : 
                    <AddableContentsListPage />
                }
            </Modal.Body>
            <Modal.Footer>
                {page === 'current' ?
                    <Button variant='secondary' onClick={()=>setPage('add')}>新規追加</Button>
                    :
                    <></>
                }
            </Modal.Footer>
        </Modal>
    );
}