import React, { useState } from 'react';
import { Modal } from '../../common';

type Props = {
    onClose: () => void;
}

export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
    
    return (
        <Modal show={show}
            onCloseBtnClicked={() => setShow(false)}
            onClosed={props.onClose}
            >
            <Modal.Header>
                コンテンツ設定
            </Modal.Header>
            <Modal.Body>
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
}