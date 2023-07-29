import React, { useCallback, useMemo, useState } from 'react';
import { Modal }  from '../common';
import Content from './Content';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine, DataId } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../store/data/dataUtility';
import { isEqualId } from '../../store/data/dataUtility';
import { useMounted } from '../../util/useMounted';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue } from 'recoil';
import { contentsState, itemMapState } from '../../store/data/dataAtom';
import { useContents } from '../../store/data/useContents';

type Target = {
    type: 'item';
    itemId: DataId;
} | {
    type: 'content';
    contentId: DataId;
}
export default function ContentsModal() {
    const [show, setShow] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const itemMap = useRecoilValue(itemMapState);
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

    const { showProcessMessage, hideProcessMessage} = useProcessMessage();
    const { loadContents } = useContents();
    useWatch(() => {
        if (!target) return;

        if (target.type === 'item') {
            const item = itemMap[getMapKey(target.itemId)];
            if (!item) return;
    
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            if (item.contents.length > 0) {
                const h = showProcessMessage({
                    overlay: true,
                    spinner: true,
                });
                loadContents([
                        {
                            itemId: target.itemId,
                        }
                    ],
                ).finally(() => {
                    setLoaded(true);
                    hideProcessMessage(h);
                });
            } else {
                setLoaded(true);
            }
        } else {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            loadContents([
                    {
                        contentId: target.contentId,
                    }
                ],
            ).finally(() => {
                setLoaded(true);
            });

        }

    }, [target, itemMap]);

    const contentsList = useRecoilValue(contentsState);
    const contents = useMemo((): ContentsDefine[] => {
        if (!target) return [];

        let list: ContentsDefine[];
        if (target.type === 'item') {
            const item = itemMap[getMapKey(target.itemId)];
            if (!item) return [];
            if (item.contents.length === 0) return [];
            // const contentId = item.contents.id;
            list = contentsList.filter(cn => item.contents.some(ic => isEqualId(ic.id, cn.id)));
        } else {
            list = contentsList.filter(c => isEqualId(c.id, target.contentId));
        }
        return list.sort((a, b) => {
            // 日時順にソート
            return (a.date ?? '').localeCompare(b.date ?? '');
        });
    }, [contentsList, itemMap, target])

    const title = useMemo(() => {
        if (!target) return '';
        let itemId: DataId;
        if (target.type === 'item') {
            itemId = target.itemId;
        } else {
            const content = contentsList.find(c => isEqualId(c.id, target.contentId));
            if (!content) return '';
            itemId = content.itemId;
        }

        const item = itemMap[getMapKey(itemId)];
        if (!item) return '';
        return item.name;
    }, [target, contentsList, itemMap]);

    const onCloseBtnClicked = useCallback(() => {
        setShow(false);
    }, []);

    const onClosed = useCallback(() => {
        setTarget(undefined);
    }, []);

    const body = useMemo(() => {
        if (!target) return null;

        if (contents.length === 0) {
            return (
                <div className={styles.NoContentParagraph}>
                    <p>コンテンツなし</p>
                    {target.type === 'item' &&
                        <AddContentMenu style='button' target={{itemId: target.itemId}} />
                    }
                </div>
            )
        }

        return contents.map((content) => {
            return (
                <Content key={getMapKey(content.id)} itemId={content.itemId}  content={content} />
            )
        })

    }, [contents, target]);

    return (
        <Modal show={show} spinner={!loaded}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                <div className={styles.ItemHeader}>
                    {title}
                    {(target?.type === 'item' && contents.length > 0) &&
                    <AddContentMenu target={{itemId: target.itemId}} />
                }
                </div>
            </Modal.Header>
            <Modal.Body>
                {body}
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>
    );
}