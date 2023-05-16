import React, { useMemo } from 'react';
import styles from './ItemContents.module.scss';
import { DataId, ItemContentInfo, ItemDefine } from '../../279map-common';
import { BsThreeDots } from 'react-icons/bs';
import { useFilter } from '../../store/useFilter';
import MyThumbnail from '../common/image/MyThumbnail';
import { isEqualId } from '../../store/data/dataUtility';

type Props = {
    item: ItemDefine;
}

/**
 * ポップアップ内コンテンツ（アイテム単位）
 * @param props 
 * @returns 
 */
export default function ItemContents(props: Props) {

    const { filterTargetContentIds } = useFilter();

    // 表示する画像URL
    const imageContentId = useMemo((): DataId | null => {
        const getImageOwnerContentId = (content: ItemContentInfo) : DataId | undefined => {
            if ((filterTargetContentIds === undefined || filterTargetContentIds?.some(filteredId => isEqualId(filteredId, content.id))) && content.hasImage) {
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
            if (imageContentId) {
                break;
            }
        }
        if (!imageContentId) {
            return null;
        }
        return imageContentId;

    }, [props.item, filterTargetContentIds]);

    if (imageContentId) {
        return (
            <div className={styles.ImageContainer}>
                <MyThumbnail className={styles.Image} id={imageContentId} alt="contents" />
            </div>
        )
    } else {
        return (
            <div className={styles.ThreeDots}>
                <BsThreeDots />
            </div>
        )
    }
}
