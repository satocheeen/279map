import React, { useState } from 'react';
import { Modal } from '../common';
import { DataId } from '279map-common';
import { itemMapState } from '../../store/item';
import { useRecoilValue } from 'recoil';
import { getMapKey } from '../../util/dataUtility';
import FormGroup from '../common/form/FormGroup';
import Input from '../common/form/Input';

type Props = {
    target: DataId;
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    const itemMap = useRecoilValue(itemMapState);
    const [title, setTitle] = useState<string>(
        itemMap[getMapKey(props.target)]?.name ?? ''
    )

    return (
        <Modal show onCloseBtnClicked={props.onClose}>
            <Modal.Header>建物名編集</Modal.Header>
            <Modal.Body>
                <FormGroup label='建物名'>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormGroup>
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}