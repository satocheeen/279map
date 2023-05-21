import React, { useMemo, useCallback, useState } from 'react';
import { RootState, useAppDispatch } from '../../../store/configureStore';
import { Modal } from '../../common';
import ContentCard from './ContentCard';
import { loadContents } from '../../../store/data/dataThunk';
import styles from './SelectContentDialog.module.scss';
import { useContents } from '../../../store/useContents';
import { ContentsDefine, DataId } from '279map-common';
import { getMapKey, isEqualId } from '../../../store/data/dataUtility';
import { useWatch } from '../../../util/useWatch';
import { useSelector } from 'react-redux';

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

        return idList;

    }, [props.itemIds, getDescendantContentsIdList]);

    /**
     * 対象コンテンツをロードする
     */
    useWatch(() => {
        dispatch(loadContents({
            targets: contentIds.map(id => {
                return {
                    contentId: id,
                }
            }),
        }));
    }, [contentIds]);

    const contentsList = useSelector((state: RootState) => state.data.contentsList);
    const contents = useMemo(() => {
        const list = contentIds.map(id => {
            return contentsList.find((content) => isEqualId(content.id, id));
        }).filter(content => content !== undefined) as ContentsDefine[];
        return list.sort((a, b) => {
            return (a.date ?? '').localeCompare(b.date ?? '');
        })
    }, [contentIds, contentsList]);

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
                        {contents.map(content => {
                            return (
                                <li key={getMapKey(content.id)}>
                                    <ContentCard content={content} />
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