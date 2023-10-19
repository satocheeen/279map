import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../common';
import { DataId, MapKind } from '279map-common';
import FormGroup from '../common/form/FormGroup';
import Input from '../common/form/Input';
import { UpdateItemAPI } from 'tsunagumap-api';
import useConfirm from '../common/confirm/useConfirm';
import { useApi } from '../../api/useApi';
import { ConfirmBtnPattern } from '../common/confirm/types';
import { useItem } from '../../store/item/useItem';
import { useAtom } from 'jotai';
import { currentMapKindAtom } from '../../store/session';

type Props = {
    target: DataId;
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    const { getItem } = useItem();
    // const itemMap = useRecoilValue(itemMapState);
    const [title, setTitle] = useState<string>(
        getItem(props.target)?.name ?? ''
    )

    const { callApi } = useApi();
    const [registing, setRegisting] = useState(false);
    const { confirm } = useConfirm();
    const onOk = useCallback(async() => {
        setRegisting(true);
        try {
            await callApi(UpdateItemAPI, {
                targets: [
                    {
                        id: props.target,
                        name: title,
                    }
                ]
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
    }, [callApi, props, title, confirm])

    const [ mapKind ] = useAtom(currentMapKindAtom);
    const label = useMemo(() => {
        if (mapKind === MapKind.Real) {
            return '地名'
        } else {
            return '建物名'
        }
    }, [mapKind])

    return (
        <Modal show onCloseBtnClicked={props.onClose} spinner={registing}>
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