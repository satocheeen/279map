import React, { useCallback, useMemo } from 'react';
import { PopupItem } from './PointsPopup';
import Content from '../contents/Content';
import styles from './ItemContents.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import AddContentMenu from './AddContentMenu';
import { Auth, ContentsDefine, ItemContentInfo, ItemDefine } from '279map-common';
import { useAPI } from '../../api/useAPI';
import { BsThreeDots } from 'react-icons/bs';
import { doCommand } from '../../util/Commander';

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

    const editable = useSelector((state: RootState) => state.session.connectedMap?.authLv === Auth.Edit);

    // 表示する画像URL
    const imageUrl = useMemo((): string | null => {
        const getImageOwnerContentId = (content: ItemContentInfo) : string | undefined => {
            if (content.hasImage) {
                return content.id;
            }
            let id: string | undefined;
            content.children?.some(child => {
                id = getImageOwnerContentId(child);
                return id ? true : false;
            });
            return id;
        }
        if (!props.item.contents) {
            return null;
        }
        const imageContentId = getImageOwnerContentId(props.item.contents);
        if (!imageContentId) {
            return null;
        }
        return `${apiUrl}getthumb?id=${imageContentId}`;

    }, [apiUrl, props.item]);

    const onClick = useCallback(() => {
        if (!props.item.contents) return;

        doCommand({
            command: 'ShowContentsModal',
            param: {
                itemId: props.item.id,
                contentId: props.item.contents.id,
            }
        });
    }, [props.item]);

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
