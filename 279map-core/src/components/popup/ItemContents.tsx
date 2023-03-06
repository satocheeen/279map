import React, { useCallback, useMemo } from 'react';
import styles from './ItemContents.module.scss';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { Auth, ItemContentInfo, ItemDefine } from '279map-common';
import { useAPI } from '../../api/useAPI';
import { BsThreeDots } from 'react-icons/bs';
import { operationActions } from '../../store/operation/operationSlice';
import { useFilter } from '../../store/useFilter';

type Props = {
    item: ItemDefine;
}

/**
 * ポップアップ内コンテンツ（アイテム単位）
 * @param props 
 * @returns 
 */
export default function ItemContents(props: Props) {
    const { apiUrl } = useAPI();

    const dispatch = useAppDispatch();
    const { filterTargetContentIds } = useFilter();
    const editable = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap.authLv === Auth.Edit
    });

    // 表示する画像URL
    const imageUrl = useMemo((): string | null => {
        const getImageOwnerContentId = (content: ItemContentInfo) : string | undefined => {
            if ((filterTargetContentIds === undefined || filterTargetContentIds?.includes(content.id)) && content.hasImage) {
                return content.id;
            }
            let id: string | undefined;
            content.children?.some(child => {
                id = getImageOwnerContentId(child);
                return id ? true : false;
            });
            return id;
        }
        if (props.item.contents.length === 0) {
            return null;
        }
        let imageContentId: string | undefined ;
        for (const content of props.item.contents) {
            imageContentId = getImageOwnerContentId(content);
            if (!imageContentId) {
                break;
            }
        }
        if (!imageContentId) {
            return null;
        }
        return `${apiUrl}getthumb?id=${imageContentId}`;

    }, [apiUrl, props.item, filterTargetContentIds]);

    const onClick = useCallback(() => {
        // if (!props.item.contents) return;
        // dispatch(operationActions.setSelectItem([props.item.id]));

    }, [props.item, dispatch]);

    if (imageUrl) {
        return (
            <div className={styles.ImageContainer} onClick={onClick}>
                <img className={styles.Image} src={imageUrl} alt="contents" />
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
