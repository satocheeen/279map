import React, { useCallback, useMemo, useState } from 'react';
import { Modal }  from '../common';
import Content from './Content';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine, DataId } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../util/dataUtility';
import { isEqualId } from '../../util/dataUtility';
import { useMounted } from '../../util/useMounted';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue } from 'recoil';
import { itemMapState } from '../../store/item';
import { useMap } from '../map/useMap';
import { useSubscribe } from '../../util/useSubscribe';

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
    const [ contentsList, setContentsList ] = useState<ContentsDefine[]>([]);
    const { getApi } = useMap();
    const { subscribe, unsubscribe } = useSubscribe();

    const loadContentsInItem = useCallback(async(itemId: DataId) => {
        const h = showProcessMessage({
            overlay: true,
            spinner: true,
        });
        const result = await getApi().getContents([
            {
                itemId,
            }
        ]);
        setContentsList(result);
        hideProcessMessage(h);

    }, []);

    useWatch(() => {
        if (!target) return;

        if (target.type === 'item') {
            const item = itemMap[getMapKey(target.itemId)];
            if (!item) return;
    
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            if (item.contents.length > 0) {
                loadContentsInItem(target.itemId)
                .finally(() => {
                    setLoaded(true);
                });
                subscribe('content-update/parent', target.itemId, () => loadContentsInItem(target.itemId));
            } else {
                setLoaded(true);
            }
        } else {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            getApi().getContents([
                    {
                        contentId: target.contentId,
                    }
                ],
            ).then(result => {
                setContentsList(result);

            }).finally(() => {
                setLoaded(true);
            });

        }

        return () => {
            if (target.type === 'item') {
                unsubscribe('content-update/parent', target.itemId);
            }
        }

    }, [target, itemMap]);

    const contents = useMemo((): ContentsDefine[] => {
        return contentsList.sort((a, b) => {
            // 日時順にソート
            return (a.date ?? '').localeCompare(b.date ?? '');
        });
    }, [contentsList])

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