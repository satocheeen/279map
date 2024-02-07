import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../common';
import FormGroup from '../common/form/FormGroup';
import Input from '../common/form/Input';
import useConfirm from '../common/confirm/useConfirm';
import { ConfirmBtnPattern } from '../common/confirm/types';
import { useItems } from '../../store/item/useItems';
import { useAtom } from 'jotai';
import { currentMapKindAtom } from '../../store/session';
import { modalSpinnerAtom } from '../common/modal/Modal';
import { useAtomCallback } from 'jotai/utils';
import { clientAtom } from 'jotai-urql';
import { MapKind, UpdateItemsDocument } from '../../graphql/generated/graphql';
import { DataId } from '../../types-common/common-types';

type Props = {
    target: DataId;
    onClose: () => void;
}

export default function EditItemNameModal(props: Props) {
    const { getItem } = useItems();
    // const itemMap = useRecoilValue(itemMapState);
    const [title, setTitle] = useState<string>(
        getItem(props.target)?.name ?? ''
    )

    const [ gqlClient ] = useAtom(clientAtom);
    // const [registing, setRegisting] = useAtom(modalSpinnerAtom);
    const { confirm } = useConfirm();
    const onOk = useAtomCallback(
        useCallback(async(get, set) => {
            set(modalSpinnerAtom, true);
            try {
                await gqlClient.mutation(UpdateItemsDocument, {
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
                set(modalSpinnerAtom, false);

            }
        }, [gqlClient, props, title, confirm])
    );

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