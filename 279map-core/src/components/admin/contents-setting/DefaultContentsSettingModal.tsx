import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../../common';
import CurrentContentsListPage from './CurrentContentsListPage';
import AddableContentsListPage, { ContentDatasourceItem } from './AddableContentsListPage';
import { useApi } from '../../../api/useApi';
import { LinkContentDatasourceToMapAPI } from 'tsunagumap-api';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useAtomCallback } from 'jotai/utils';

type Props = {
    onClose: () => void;
}

export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
    const [page, setPage] = useState<'current'|'add'>('current'); 

    const [addTargetList, setAddTargetList] = useState<ContentDatasourceItem[]>([]);
    const handleChangeAddTargetChange = useCallback((items: ContentDatasourceItem[]) => {
        setAddTargetList(items);
    }, [])

    const { callApi } = useApi();
    const handleAddClicked = useAtomCallback(
        useCallback(async(get, set) => {
            set(modalSpinnerAtom, true);
            await callApi(LinkContentDatasourceToMapAPI, {
                contents: addTargetList.map(target => {
                    return {
                        datasourceId: target.datasourceId,
                        name: target.name,
                    }
                })
            })
            set(modalSpinnerAtom, false);
        }, [addTargetList, callApi])
    )

    const footer = useMemo(() => {
        switch(page) {
            case 'current':
                return (
                    <Button variant='secondary' onClick={()=>setPage('add')}>新規追加</Button>
                )
            case 'add':
                return (
                    <>
                        <Button variant='secondary' onClick={()=>setPage('current')}>戻る</Button>
                        <Button variant='secondary' onClick={handleAddClicked} disabled={addTargetList.length===0}>追加</Button>
                    </>
                )
        }
    }, [page, addTargetList, handleAddClicked])

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
                    <AddableContentsListPage onChange={handleChangeAddTargetChange} />
                }
            </Modal.Body>
            <Modal.Footer>
                {footer}
            </Modal.Footer>
        </Modal>
    );
}