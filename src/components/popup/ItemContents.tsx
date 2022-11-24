import React, { useMemo } from 'react';
import { PopupItem } from './PointsPopup';
import Content from './Content';
import styles from './ItemContents.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import AddContentMenu from './AddContentMenu';
import { Auth } from '279map-common';

type Props = {
    item: PopupItem;
}

/**
 * ポップアップ内コンテンツ（アイテム単位）
 * @param props 
 * @returns 
 */
export default function ItemContents(props: Props) {
    const content = useMemo(() => {
        // TODO: フィルタの考慮必要かも
        return props.item.content;
    }, [props.item.content]);

    const editable = useSelector((state: RootState) => state.session.connectedMap?.authLv === Auth.Edit);

    return (
        <div>
            {content ?
                <Content itemId={props.item.id} content={content} />
                :
                <div className={styles.IconAreas}>
                    {editable &&
                        <AddContentMenu itemId={props.item.id} />
                    }
                </div>
            }
        </div>
    );
}
