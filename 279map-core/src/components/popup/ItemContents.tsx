import React, { useCallback, useMemo } from 'react';
import styles from './ItemContents.module.scss';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Auth, DataId, ItemContentInfo, ItemDefine } from '../../279map-common';
import { BsThreeDots } from 'react-icons/bs';
import { operationActions } from '../../store/operation/operationSlice';
import { useFilter } from '../../store/useFilter';
import MyImage from '../common/image/MyImage';

type Props = {
    item: ItemDefine;
}

/**
 * ポップアップ内コンテンツ（アイテム単位）
 * @param props 
 * @returns 
 */
export default function ItemContents(props: Props) {

    const dispatch = useAppDispatch();
    const { filterTargetContentIds } = useFilter();
    const editable = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap.authLv === Auth.Edit
    });

    // 表示する画像URL
    const imageContentId = useMemo((): DataId | null => {
        const getImageOwnerContentId = (content: ItemContentInfo) : DataId | undefined => {
            if ((filterTargetContentIds === undefined || filterTargetContentIds?.includes(content.id)) && content.hasImage) {
                return content.id;
            }
            let id: DataId | undefined;
            content.children?.some(child => {
                id = getImageOwnerContentId(child);
                return id ? true : false;
            });
            return id;
        }
        if (props.item.contents.length === 0) {
            return null;
        }
        let imageContentId: DataId | undefined ;
        for (const content of props.item.contents) {
            imageContentId = getImageOwnerContentId(content);
            if (!imageContentId) {
                break;
            }
        }
        if (!imageContentId) {
            return null;
        }
        return imageContentId;

    }, [props.item, filterTargetContentIds]);

    const onClick = useCallback(() => {
        // if (!props.item.contents) return;
        // dispatch(operationActions.setSelectItem([props.item.id]));

    }, [props.item, dispatch]);

    if (imageContentId) {
        return (
            <div className={styles.ImageContainer} onClick={onClick}>
                <MyImage type='thumbnail' className={styles.Image} id={imageContentId} alt="contents" />
            </div>
        )
    } else {
        return (
            <div className={styles.ThreeDots} onClick={onClick}>
                <BsThreeDots />
            </div>
        )
    }
}
