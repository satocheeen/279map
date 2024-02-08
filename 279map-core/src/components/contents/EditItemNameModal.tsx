import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../common';
import FormGroup from '../common/form/FormGroup';
import Input from '../common/form/Input';
import { useItems } from '../../store/item/useItems';
import { useAtom } from 'jotai';
import { currentMapKindAtom } from '../../store/session';
import { MapKind } from '../../graphql/generated/graphql';
import { DataId } from '../../types-common/common-types';
import useItemProcess from '../../store/item/useItemProcess';

type Props = {
    target: DataId;
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    const { getItem } = useItems();
    const [title, setTitle] = useState<string>(
        getItem(props.target)?.name ?? ''
    )

    const { updateItems } = useItemProcess();
    const onOk = useCallback(async() => {
        updateItems([
            {
                id: props.target,
                name: title,
            }
        ])
        props.onClose();
    }, [props, title, updateItems]);

    const [ mapKind ] = useAtom(currentMapKindAtom);
    const label = useMemo(() => {
        if (mapKind === MapKind.Real) {
            return '地名'
        } else {
            return '建物名'
        }
    }, [mapKind])

    return (
        <Modal show onCloseBtnClicked={props.onClose}>
            <Modal.Header>
                <span>{label}編集</span>
            </Modal.Header>
            <Modal.Body>
                <FormGroup label={label}>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='primary' onClick={onOk}>OK</Button>
                <Button variant='secondary' onClick={props.onClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}