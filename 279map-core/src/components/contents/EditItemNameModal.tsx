import React from 'react';
import { Modal } from '../common';

type Props = {
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    return (
        <Modal show onCloseBtnClicked={props.onClose}>
            <Modal.Header>建物名編集</Modal.Header>
            <Modal.Body>

            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}