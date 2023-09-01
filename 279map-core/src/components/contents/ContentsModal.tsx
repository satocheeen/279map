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
import { useAtom } from 'jotai';
import { currentMapKindAtom } from '../../store/session';

export type Props = ({
    type: 'item' | 'content';
    id: DataId;
}) & {
    onClose?: () => void;
}

export default function ContentsModal(props: Props) {
    const [show, setShow] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [item, setItem] = useState<ItemDefine | undefined>();

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
    const [ mapKind ] = useAtom(currentMapKindAtom);
    useEffect(() => {
        if (props.type === 'item') {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            loadContentsInItem(props.id)
            .finally(() => {
                setLoaded(true);
            });
            subscribe('childcontents-update', mapKind, props.id, () => loadContentsInItem(props.id));

            setTargetsItem(props.id);

        } else {
            setLoaded(false);
            setShow(true);
    
            // 最新コンテンツ取得
            getApi().getContents([
                    {
                        contentId: props.id,
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
            if (props.type === 'item') {
                unsubscribe('childcontents-update', mapKind, props.id);
            }
        }

    }, [props, getApi, subscribe, unsubscribe, setTargetsItem, loadContentsInItem]);

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
        if (props.onClose) {
            props.onClose();
        }
    }, [props]);

    const body = useMemo(() => {
        if (!props) return null;

        if (contents.length === 0) {
            return (
                <div className={styles.NoContentParagraph}>
                    <p>コンテンツなし</p>
                    {props.type === 'item' &&
                        <AddContentMenu style='button' target={{itemId: props.id}} />
                    }
                </div>
            )
        }

        return contents.map((content) => {
            return (
                <Content key={getMapKey(content.id)} itemId={content.itemId}  content={content} />
            )
        })

    }, [contents, props]);

    return (
        <Modal show={show} spinner={!loaded}
            onCloseBtnClicked={onCloseBtnClicked}
            onClosed={onClosed}
            >
            <Modal.Header>
                <div className={styles.ItemHeader}>
                    {title}
                    {(props?.type === 'item' && contents.length > 0) &&
                    <AddContentMenu target={{itemId: props.id}} />
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