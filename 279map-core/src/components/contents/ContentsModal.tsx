import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal }  from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine, DataId } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../store/data/dataUtility';
import { isEqualId } from '../../store/data/dataUtility';

type Target = {
    type: 'item';
    itemId: DataId;
} | {
    type: 'content';
    contentId: DataId;
}
export default function ContentsModal() {
    const [show, setShow] = useState(false);
    const dispatch = useAppDispatch();
    const [loaded, setLoaded] = useState(false);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    const { disabledContentDialog } = useContext(OwnerContext);
    // set content ID when show a content.
    const [contentId, setContentId] = useState<DataId|undefined>();

    useEffect(() => {
        const h = addListener('ShowContentInfo', async(contentId: DataId) => {
            setContentId(contentId);
        });

        return () => {
            removeListener(h);
        }
    }, []);

    /**
     * show dialog when select an item.
     */
    const itemId = useMemo((): DataId | undefined => {
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
            const item = itemMap[getMapKey(target.itemId)];
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
            })).finally(() => {
                setLoaded(true);
            });

        }

    }, [target, itemMap, dispatch]);

    const contents = useSelector((state: RootState): ContentsDefine[] => {
        if (!target) return [];

        let list: ContentsDefine[];
        if (target.type === 'item') {
            const item = state.data.itemMap[getMapKey(target.itemId)];
            if (!item) return [];
            if (item.contents.length === 0) return [];
            // const contentId = item.contents.id;
            list = state.data.contentsList.filter(cn => item.contents.some(ic => isEqualId(ic.id, cn.id)));
        } else {
            list = state.data.contentsList.filter(c => isEqualId(c.id, target.contentId));
        }
        return list.sort((a, b) => {
            // 日時順にソート
            return (a.date ?? '').localeCompare(b.date ?? '');
        });
    })

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, []);

    const onClosed = useCallback(() => {
        dispatch(operationActions.unselectItem());
        setContentId(undefined);
    }, [dispatch]);

    if (contents.length === 0) {
        return null;
    }

    return (
        <Modal show={show} spinner={!loaded}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                <div className={styles.ItemHeader}>
                    詳細
                    {itemId &&
                    <AddContentMenu target={{itemId}} />
                }
                </div>
            </Modal.Header>
            <Modal.Body>
                {contents.map((content) => {
                    return (
                        <Content key={getMapKey(content.id)} itemId={content.itemId}  content={content} />
                    )
                })}
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}