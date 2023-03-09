import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine } from '../../279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';

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
    
            if (item.contents.length===0) {
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

    const contents = useSelector((state: RootState): ContentsDefine[] => {
        if (!target) return [];

        if (target.type === 'item') {
            const item = state.data.itemMap[target.itemId];
            if (!item) return [];
            if (item.contents.length === 0) return [];
            // const contentId = item.contents.id;
            return state.data.contentsList.filter(cn => item.contents.some(ic => ic.id === cn.id));
        } else {
            return state.data.contentsList.filter(c => c.id === target.contentId);
        }
    })

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, []);

    const onClosed = useCallback(() => {
        dispatch(operationActions.unselectItem());
        setContentId(undefined);
    }, [dispatch]);

    return (
        <Modal show={show} spinner={!loadied}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <ModalHeader>
                <div className={styles.ItemHeader}>
                    詳細
                    {itemId &&
                    <AddContentMenu target={{itemId}} />
                }
                </div>
            </ModalHeader>
            <ModalBody>
                {contents.map((content) => {
                    return (
                        <Content key={content.id} itemId={content.itemId}  content={content} />
                    )
                })}
            </ModalBody>
            <ModalFooter>

            </ModalFooter>
        </Modal>
    );
}