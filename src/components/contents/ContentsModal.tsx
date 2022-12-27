import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { addListener, removeListener } from '../../util/Commander';

type Target = {
    type: 'item';
    itemId: string;
} | {
    type: 'content';
    contentId: string;
}
export default function ContentsModal() {
    const [show, setShow] = useState(false);
    const dispatch = useAppDispatch();
    const [loadied, setLoaded] = useState(false);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    const { disabledContentDialog } = useContext(OwnerContext);
    // set content ID when show a content.
    const [contentId, setContentId] = useState<string|undefined>();

    useEffect(() => {
        const h = addListener('ShowContentInfo', async(contentId: string) => {
            setContentId(contentId);
        });

        return () => {
            removeListener(h);
        }
    }, []);

    /**
     * show dialog when select an item.
     */
    const itemId = useMemo((): string | undefined => {
        if (disabledContentDialog) {
            return;
        }
        if (selectedItemIds.length === 0) {
            return;
        }
        return selectedItemIds[0];

    }, [disabledContentDialog, selectedItemIds]);

    const target = useMemo((): Target | undefined => {
        if (contentId) {
            return {
                type: 'content',
                contentId,
            }
        }
        if (itemId) {
            return {
                type: 'item',
                itemId,
            }
        }

    }, [contentId, itemId]);

    useEffect(() => {
        if (!target) return;

        if (target.type === 'item') {
            const item = itemMap[target.itemId];
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
                        itemId: target.itemId,
                    }
                ],
                keepCurrentData: true,
            })).finally(() => {
                setLoaded(true);
            });
        } else {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            dispatch(loadContents({
                targets: [
                    {
                        contentId: target.contentId,
                    }
                ],
                keepCurrentData: true,
            })).finally(() => {
                setLoaded(true);
            });

        }

    }, [target, itemMap, dispatch]);

    const rootContent = useSelector((state: RootState) => {
        if (!target) return;

        if (target.type === 'item') {
            const item = state.data.itemMap[target.itemId];
            if (!item.contents) return;
            const contentId = item.contents.id;
            return state.data.contentsList.find(cn => cn.id === contentId);
        } else {
            return state.data.contentsList.find(c => c.id === target.contentId);
        }
    });

    useEffect(() => {
        console.log('rootContent', rootContent);
    }, [rootContent])

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, []);

    const onClosed = useCallback(() => {
        dispatch(operationActions.unselectItem());
        setContentId(undefined);
    }, [dispatch]);

    return (
        <Modal show={show} spinner={!loadied}
            closebtn onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <ModalHeader>詳細</ModalHeader>
            <ModalBody>
                {rootContent &&
                    <Content itemId={rootContent.itemId}  content={rootContent} />
                }
            </ModalBody>
            <ModalFooter>

            </ModalFooter>
        </Modal>
    );
}