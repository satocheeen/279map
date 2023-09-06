import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Modal }  from '../common';
import Content from './Content';
import { Auth, ContentsDefine, DataId, ItemDefine, MapKind } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../util/dataUtility';
import { useSubscribe } from '../../api/useSubscribe';
import { useItem } from '../../store/item/useItem';
import { useAtom } from 'jotai';
import { authLvAtom, currentMapKindAtom } from '../../store/session';
import { useApi } from '../../api/useApi';
import { GetContentsAPI } from 'tsunagumap-api';
import { compareAuth } from '../../util/CommonUtility';
import EditItemNameModal from './EditItemNameModal';
import PopupMenuIcon from '../popup/PopupMenuIcon';
import { MdEdit } from 'react-icons/md';
import { dataSourcesAtom } from '../../store/datasource';

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

    const [ contentsList, setContentsList ] = useState<ContentsDefine[]>([]);
    const { callApi } = useApi();
    const { subscribeMap: subscribe, unsubscribeMap: unsubscribe } = useSubscribe();

    const { getItem } = useItem();
    const loadContentsInItem = useCallback(async(itemId: DataId) => {
        const item = getItem(itemId);
        if (!item || item.contents.length === 0) return;

        setLoaded(false);
        const result = await callApi(GetContentsAPI, [
            {
                itemId,
            }
        ]);
        setContentsList(result.contents);
        setLoaded(true);

    }, [callApi, getItem]);

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
            callApi(GetContentsAPI, [
                    {
                        contentId: props.id,
                    }
                ],
            ).then(res => {
                const result = res.contents;
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

    }, [props.id, props.type, mapKind, callApi, subscribe, unsubscribe, setTargetsItem, loadContentsInItem]);

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

    const [ authLv ] = useAtom(authLvAtom);
    const [ datasources ] = useAtom(dataSourcesAtom);
    const isShowItemNameEditBtn = useMemo(() => {
        if (props.type !== 'item') return false;
        const targetDs = datasources.find(ds => ds.dataSourceId === props.id.dataSourceId);
        if (!targetDs) return false;
        const info = mapKind === MapKind.Real ? targetDs.itemContents.RealItem : targetDs.itemContents.VirtualItem;
        if (!info) return false;
        return info.editable && compareAuth(authLv, Auth.Edit) >= 0
    }, [props, authLv, datasources, mapKind])

    const itemNameEditTipLabel = useMemo(() => {
        if (mapKind === MapKind.Real) {
            return '地名編集'
        } else {
            return '建物名編集'
        }
    }, [mapKind])

    const [showEditItemNameModal, setShowEditItemNameModal] = useState(false);
    const onEditItemName = useCallback(() => {
        setShowEditItemNameModal(true);
    }, []);

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
        <>
            <Modal show={show} spinner={!loaded}
                onCloseBtnClicked={onCloseBtnClicked}
                onClosed={onClosed}
                >
                <Modal.Header>
                    <div className={styles.ItemHeader}>
                        {title}
                        {(props.type === 'item' && contents.length > 0) &&
                        <AddContentMenu target={{itemId: props.id}} />
                        }
                        {isShowItemNameEditBtn &&
                            <PopupMenuIcon tooltip={itemNameEditTipLabel} onClick={onEditItemName}>
                                <MdEdit />
                            </PopupMenuIcon>
                        }
                    </div>
                </Modal.Header>
                <Modal.Body>
                    {body}
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
            </Modal>
            {props.type === 'item' && showEditItemNameModal &&
                <EditItemNameModal target={props.id} onClose={() => setShowEditItemNameModal(false)} />
            }
        </>
    );
}