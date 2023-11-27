import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '../../common';
import CurrentContentsListPage from './CurrentContentsListPage';
import AddableContentsListPage from './AddableContentsListPage';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useAtomCallback } from 'jotai/utils';
import { ContentsDatasource, LinkContentsDatasourceDocument } from '../../../graphql/generated/graphql';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';

type Props = {
    onClose: () => void;
}

export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
    const [page, setPage] = useState<'current'|'add'>('current'); 

    const [addTargetList, setAddTargetList] = useState<ContentsDatasource[]>([]);
    const handleChangeAddTargetChange = useCallback((items: ContentsDatasource[]) => {
        setAddTargetList(items);
    }, [])

    const [ gqlClient ] = useAtom(clientAtom);
    const handleAddClicked = useAtomCallback(
        useCallback(async(get, set) => {
            set(modalSpinnerAtom, true);
            await gqlClient.mutation(LinkContentsDatasourceDocument, {
                contentsDatasources: addTargetList,
            });
            set(modalSpinnerAtom, false);

            // コンテンツ一覧ページに戻る
            setPage('current');
        }, [addTargetList, gqlClient])
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