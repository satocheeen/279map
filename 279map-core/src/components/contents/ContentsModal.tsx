import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Modal }  from '../common';
import Content from './Content';
import { addListener, removeListener } from '../../util/Commander';
import { ContentsDefine, DataId, ItemDefine } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../util/dataUtility';
import { useMounted } from '../../util/useMounted';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { useMap } from '../map/useMap';
import { useSubscribe } from '../../util/useSubscribe';
import { useItem } from '../../store/item/useItem';

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
    const [target, setTarget] = useState<Target|undefined>();
    const [item, setItem] = useState<ItemDefine | undefined>();

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
    const { subscribeMap: subscribe, unsubscribeMap: unsubscribe } = useSubscribe();

    const { getItem } = useItem();
    const loadContentsInItem = useCallback(async(itemId: DataId) => {
        const item = getItem(itemId);
        if (!item || item.contents.length === 0) return;

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

    // TODO: useEffectから無限呼び出しされないために無効にしている。時間ある時に依存関係見直し
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getApi, getItem, /* hideProcessMessage, showProcessMessage */]);

    const setTargetsItem = useCallback(async(itemId: DataId) => {
        const item = getItem(itemId);
        setItem(item);
    }, [getItem]);

    // 表示対象が指定されたらコンテンツロード
    useEffect(() => {
        if (!target) return;

        if (target.type === 'item') {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            loadContentsInItem(target.itemId)
            .finally(() => {
                setLoaded(true);
            });
            subscribe('childcontents-update', target.itemId, () => loadContentsInItem(target.itemId));

            setTargetsItem(target.itemId);

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
                if (result.length === 0) {
                    setItem(undefined);
                } else {
                    setTargetsItem(result[0].itemId);
                }
    
            }).finally(() => {
                setLoaded(true);
            });
        }


        return () => {
            if (target.type === 'item') {
                unsubscribe('childcontents-update', target.itemId);
            }
        }

    }, [target, getApi, subscribe, unsubscribe, setTargetsItem, loadContentsInItem]);

    const contents = useMemo((): ContentsDefine[] => {
        return contentsList.sort((a, b) => {
            // 日時順にソート
            return (a.date ?? '').localeCompare(b.date ?? '');
        });
    }, [contentsList])

    const title = useMemo(() => {
        if (!item) return '';
        return item.name;
    }, [item]);

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