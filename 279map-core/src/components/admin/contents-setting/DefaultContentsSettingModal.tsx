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
    const [page, setPAge] = useState<'current'|'add'>('current'); 
    const [showSpinner, setShowSpinner] = useState(false);

    return (
        <Modal show={show}
            spinner={showSpinner}
            onCloseBtnClicked={() => setShow(false)}
            onClosed={props.onClose}
            >
            <Modal.Header>
                コンテンツ設定
            </Modal.Header>
            <Modal.Body>
                {page === 'current' ?
                    <CurrentContentsListPage onAddContentsBtnClicked={()=>setPAge('add')} />
                    : 
                    <AddableContentsListPage onLoadingStateChange={(val) => setShowSpinner(val)}/>
                }
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
}