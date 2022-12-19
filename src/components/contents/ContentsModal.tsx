import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { addListener } from '../../util/Commander';

export default function ContentsModal() {
    const [contentId, setContentId] = useState<string>();
    const [show, setShow] = useState(false);
    const [itemId, setItemId] = useState<string>();
    const dispatch = useAppDispatch();
    const [loadied, setLoaded] = useState(false);

    useEffect(() => {
        addListener('ShowContentsModal', async(param: {contentId: string; itemId: string}) => {
            setLoaded(false);
            setContentId(param.contentId);
            setItemId(param.itemId);
            setShow(true);
        });

    }, []);

    useEffect(() => {
        if (!contentId) return;

        // 最新コンテンツ取得
        dispatch(loadContents({
            targets: [
                {
                    contentId,
                }
            ],            
        })).finally(() => {
            setLoaded(true);
        });

    }, [dispatch, contentId]);

    const content = useSelector((state: RootState) => {
        return state.data.contentsList.find(cn => cn.id === contentId);
    });

    const onClose = useCallback(() => {
        setShow(false);
        setContentId(undefined);
        setItemId(undefined);
    }, []);

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