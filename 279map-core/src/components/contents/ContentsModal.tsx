import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Modal }  from '../common';
import { loadContents } from '../../store/data/dataThunk';
import Content from './Content';
import { useSelector } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine, DataId } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../store/data/dataUtility';
import { isEqualId } from '../../store/data/dataUtility';
import { useMounted } from '../../util/useMounted';

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
    const [target, setTarget] = useState<Target|undefined>();

    useMounted(() => {
        const h = addListener('ShowContentInfo', async(contentId: DataId) => {
            setTarget({
                type: 'content',
                contentId,
            });
        });
        const h2 = addListener('ShowItemInfo', async(itemId: DataId) => {
            setTarget({
                type: 'item',
                itemId,
            });
        });

        return () => {
            removeListener(h);
            removeListener(h2);
        }
    });

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
        setTarget(undefined);
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
                    {target?.type === 'item' &&
                    <AddContentMenu target={{itemId: target.itemId}} />
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