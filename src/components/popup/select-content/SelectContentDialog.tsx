import { ItemContentInfo } from '279map-common';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../store/configureStore';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../common';
import ContentCard from './ContentCard';
import { loadContents } from '../../../store/data/dataThunk';
import styles from './SelectContentDialog.module.scss';

type Props = {
    itemIds: string[];
    onCancel: () => void;
}

export default function SelectContentDialog(props: Props) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const dispatch = useAppDispatch();
    const [show, setShow] = useState(true);

    const contentIds = useMemo(() => {
        // TODO: フィルタの考慮
        const idList = [] as string[];
        props.itemIds.forEach(id => {
            const item = itemMap[id];
            if (!item) return;
            if (!item.contents) return;
            idList.push(item.contents.id);

            const getDecendant = (content: ItemContentInfo) => {
                const descendantList = [] as string[];
                content.children.forEach(child => {
                    descendantList.push(child.id);
                    const childDescendants = getDecendant(child);
                    Array.prototype.push.apply(descendantList, childDescendants);
                });
                return descendantList;
            }

            const descendants = getDecendant(item.contents);
            Array.prototype.push.apply(idList, descendants);
        });

        console.log('contenIds', idList);
        return idList;

    }, [props.itemIds, itemMap]);

    useEffect(() => {
        dispatch(loadContents({
            targets: contentIds.map(id => {
                return {
                    contentId: id,
                }
            }),
        }));
    }, [contentIds, dispatch]);

    const onCancel = useCallback(() => {
        setShow(false);
        props.onCancel();
    }, [props]);

    return (
        <Modal show={show} closebtn onCloseBtnClicked={onCancel}>
            <ModalHeader>コンテンツ選択</ModalHeader>
            <ModalBody>
                <div className={styles.Body}>
                    <ul>
                        {contentIds.map(id => {
                            return (
                                <li key={id}>
                                    <ContentCard contentId={id} />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </ModalBody>
            <ModalFooter></ModalFooter>
        </Modal>
    );
}