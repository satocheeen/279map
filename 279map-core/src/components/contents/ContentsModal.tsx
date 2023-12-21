import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Modal }  from '../common';
import Content from './Content';
import { DataId } from '279map-common';
import AddContentMenu from '../popup/AddContentMenu';
import styles from './ContentsModal.module.scss';
import { getMapKey } from '../../util/dataUtility';
import { useAtom } from 'jotai';
import { authLvAtom, currentMapKindAtom } from '../../store/session';
import { compareAuth } from '../../util/CommonUtility';
import EditItemNameModal from './EditItemNameModal';
import PopupMenuIcon from '../popup/PopupMenuIcon';
import { MdEdit } from 'react-icons/md';
import { itemDataSourcesAtom } from '../../store/datasource';
import { allItemsAtom } from '../../store/item';
import { useMap } from '../map/useMap';
import { modalSpinnerAtom } from '../common/modal/Modal';
import { clientAtom } from 'jotai-urql';
import { Auth, ChildContentsUpdateDocument, ContentsDefine, GetContentDocument, GetContentsInItemDocument, ItemTemporaryState, MapKind } from '../../graphql/generated/graphql';
import { Subscription } from 'wonka';

export type Props = ({
    type: 'item' | 'content';
    id: DataId;
}) & {
    onClose?: () => void;
}

export default function ContentsModal(props: Props) {
    const [show, setShow] = useState(false);
    const [modalSpinner, setModalSpinner] = useAtom(modalSpinnerAtom);
    const [itemId, setItemId] = useState<DataId | undefined>();

    const [ contentsList, setContentsList ] = useState<ContentsDefine[]>([]);

    const [ allItems ] = useAtom(allItemsAtom);
    const item = useMemo(() => {
        if (!itemId) return;
        const itemMap = allItems[itemId.dataSourceId] ?? {};
        return itemMap[itemId.id];

    }, [ allItems, itemId ]);

    const isTemporaryItem = useMemo(() => {
        if (props.type === 'content') return false;
        // アイテムが存在しない場合=一時アイテムが削除された場合
        if (!item) return true;

        return item?.temporary === ItemTemporaryState.Registing;
    }, [item, props.type]);

    const [ gqlClient ] = useAtom(clientAtom);
    const loadContentsInItem = useCallback(async() => {
        if (!item) return;
        if (isTemporaryItem) {
            setContentsList([]);
            return;
        }
        if (!item || !item.hasContents) {
            setContentsList([]);
            return;
        }

        setModalSpinner(true);
        const result = await gqlClient.query(GetContentsInItemDocument, {
            itemId: item.id,
        }, {
            requestPolicy: 'network-only',
        });
        const contents = result.data?.getContentsInItem ?? [];
        setContentsList(contents);
        setModalSpinner(false);

    }, [item, isTemporaryItem, setModalSpinner, gqlClient]);

    // 表示対象が指定されたらコンテンツロード
    const [ mapKind ] = useAtom(currentMapKindAtom);
    const { updateItems } = useMap();
    useEffect(() => {
        if (!mapKind) return;
        let h: Subscription;
        if (props.type === 'item') {
            setModalSpinner(true);
            setShow(true);
    
            // 最新コンテンツ取得
            loadContentsInItem()
            .finally(() => {
                setModalSpinner(false);
            });
            h = gqlClient.subscription(ChildContentsUpdateDocument, { itemId: props.id }).subscribe(async() => {
                // アイテム情報再取得
                await updateItems([{
                    id: props.id
                }]);

                // コンテンツロード
                loadContentsInItem()
            })

            setItemId(props.id);

        } else {
            setModalSpinner(true);
            setShow(true);
    
            // 最新コンテンツ取得
            gqlClient.query(GetContentDocument, {
                id: props.id,
            })
            .then(res => {
                const result = res.data?.getContent as ContentsDefine;
                setContentsList([result]);
                setItemId(result.itemId);
                setModalSpinner(false);
            });
        }


        return () => {
            if (h) {
                h.unsubscribe();
            }
        }

    }, [props.id, props.type, mapKind, loadContentsInItem, updateItems, setModalSpinner, gqlClient]);

    const contents = useMemo((): ContentsDefine[] => {
        return contentsList.sort((a, b) => {
            // 日時順にソート
            return (a.date ?? '').localeCompare(b.date ?? '');
        });
    }, [contentsList])

    const title = useMemo(() => {
        return item?.name ?? '';
    }, [item]);

    const [ authLv ] = useAtom(authLvAtom);
    const [ itemDatasources ] = useAtom(itemDataSourcesAtom);
    const isShowItemNameEditBtn = useMemo(() => {
        if (props.type !== 'item') return false;
        if (isTemporaryItem) return false;
        const targetDs = itemDatasources.find(ds => ds.datasourceId === props.id.dataSourceId);
        if (!targetDs) return false;
        return targetDs.config.editable && compareAuth(authLv, Auth.Edit) >= 0
    }, [props, authLv, itemDatasources, isTemporaryItem])

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

        if (isTemporaryItem) {
            return (
                <div className={styles.NoContentParagraph}>
                    <p>アイテムの登録処理中です。<br/>しばらくお待ちください。</p>
                </div>
            )
        }
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

    }, [contents, props, isTemporaryItem]);

    return (
        <>
            <Modal show={show}
                onCloseBtnClicked={onCloseBtnClicked}
                onClosed={onClosed}
                >
                <Modal.Header>
                    <div className={styles.ItemHeader}>
                        <div className={styles.Title}>
                            {title}
                        </div>
                        <div className={styles.SubMenu}>
                            {(props.type === 'item' && contents.length > 0) &&
                                <AddContentMenu target={{itemId: props.id}} />
                            }
                            {isShowItemNameEditBtn &&
                                <PopupMenuIcon tooltip={itemNameEditTipLabel} onClick={onEditItemName}>
                                    <MdEdit />
                                </PopupMenuIcon>
                            }
                        </div>
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