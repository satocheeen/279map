import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

export default function ContentsModal() {
    const [show, setShow] = useState(false);
    const dispatch = useAppDispatch();
    const [loadied, setLoaded] = useState(false);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    const { disabledContentDialog } = useContext(OwnerContext);

    const itemId = useMemo((): string | undefined => {
        if (disabledContentDialog) {
            return;
        }
        if (selectedItemIds.length === 0) {
            return;
        }
        return selectedItemIds[0];

    }, [disabledContentDialog, selectedItemIds]);

    useEffect(() => {
        if (!itemId) return;
        const item = itemMap[itemId];
        if (!item) return;

        if (!item.contents) {
            return;
        }
        setLoaded(false);
        setShow(true);

        // 最新コンテンツ取得
        dispatch(loadContents({
            targets: [
                {
                    itemId,
                }
            ],            
        })).finally(() => {
            setLoaded(true);
        });

    }, [itemId, itemMap, dispatch]);

    const content = useSelector((state: RootState) => {
        if (!itemId) return;
        const item = state.data.itemMap[itemId];
        if (!item.contents) return;
        const contentId = item.contents.id;
        return state.data.contentsList.find(cn => cn.id === contentId);
    });

    const onClose = useCallback(() => {
        dispatch(operationActions.unselectItem());
        setShow(false);
    }, [dispatch]);

    return (
        <Modal show={show} spinner={!loadied} closebtn onClose={onClose}>
            <ModalHeader>詳細</ModalHeader>
            <ModalBody>
                {(itemId &&content) ?
                    <Content itemId={itemId}  content={content} />
                     :
                    <div/>
                }
            </ModalBody>
            <ModalFooter>

            </ModalFooter>
        </Modal>
    );
}