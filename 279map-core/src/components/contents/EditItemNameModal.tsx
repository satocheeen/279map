import React, { useState, useCallback } from 'react';
import { Button, Modal } from '../common';
import { DataId } from '279map-common';
import { itemMapState } from '../../store/item';
import { useRecoilValue } from 'recoil';
import { getMapKey } from '../../util/dataUtility';
import FormGroup from '../common/form/FormGroup';
import Input from '../common/form/Input';
import { useMap } from '../map/useMap';
import { UpdateItemAPI } from 'tsunagumap-api';
import useConfirm, { ConfirmBtnPattern } from '../common/confirm/useConfirm';

type Props = {
    target: DataId;
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    const itemMap = useRecoilValue(itemMapState);
    const [title, setTitle] = useState<string>(
        itemMap[getMapKey(props.target)]?.name ?? ''
    )

    const { getApi } = useMap();
    const [registing, setRegisting] = useState(false);
    const { confirm } = useConfirm();
    const onOk = useCallback(async() => {
        setRegisting(true);
        try {
            await getApi().callApi(UpdateItemAPI, {
                id: props.target,
                name: title,
            });
    
            props.onClose();

        } catch(e) {
            confirm({
                message: '登録処理に失敗しました。再度実行しても問題が解決しない場合は、管理者へご連絡ください。',
                btnPattern: ConfirmBtnPattern.OkOnly,
            })
        } finally {
            setRegisting(false);

        }
    }, [getApi, props, title, confirm])

    return (
        <Modal show onCloseBtnClicked={props.onClose} spinner={registing}>
            <Modal.Header>建物名編集</Modal.Header>
            <Modal.Body>
                <FormGroup label='建物名'>
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