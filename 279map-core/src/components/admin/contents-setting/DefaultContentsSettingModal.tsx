import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../../common';
import CurrentContentsListPage from './CurrentContentsListPage';
import AddableContentsListPage, { AddableContentItem } from './AddableContentsListPage';

type Props = {
    onClose: () => void;
}

export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
    const [page, setPage] = useState<'current'|'add'>('current'); 

    const [addTargetList, setAddTargetList] = useState<AddableContentItem[]>([]);
    const handleChangeAddTargetChange = useCallback((items: AddableContentItem[]) => {
        setAddTargetList(items);
    }, [])

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
                        <Button variant='secondary' disabled={addTargetList.length===0}>追加</Button>
                    </>
                )
        }
    }, [page, addTargetList])

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