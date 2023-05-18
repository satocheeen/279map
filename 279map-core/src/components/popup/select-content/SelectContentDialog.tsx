import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '../../../store/configureStore';
import { Modal } from '../../common';
import ContentCard from './ContentCard';
import { loadContents } from '../../../store/data/dataThunk';
import styles from './SelectContentDialog.module.scss';
import { useContents } from '../../../store/useContents';
import { DataId } from '279map-common';
import { getMapKey } from '../../../store/data/dataUtility';

type Props = {
    itemIds: DataId[];
    onCancel: () => void;
}

export default function SelectContentDialog(props: Props) {
    const dispatch = useAppDispatch();
    const [show, setShow] = useState(true);
    const { getDescendantContentsIdList } = useContents();

    const contentIds = useMemo(() => {
        const idList = [] as DataId[];
        props.itemIds.forEach(id => {
            const descendants = getDescendantContentsIdList(id, true);
            if (descendants.length === 0) return;

            Array.prototype.push.apply(idList, descendants);
        });

        console.log('contenIds', idList);
        return idList;

    }, [props.itemIds, getDescendantContentsIdList]);

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
        <Modal show={show} onCloseBtnClicked={onCancel}>
            <Modal.Header>コンテンツ選択</Modal.Header>
            <Modal.Body>
                <div className={styles.Body}>
                    <ul>
                        {contentIds.map(id => {
                            return (
                                <li key={getMapKey(id)}>
                                    <ContentCard contentId={id} />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </Modal.Body>
            <Modal.Footer></Modal.Footer>
        </Modal>
    );
}