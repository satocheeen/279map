import React, { CSSProperties, useCallback, useMemo } from 'react';
import { colorWithAlpha } from '../../util/CommonUtility';
import styles from './CategoryBadge.module.scss';
import { MdClose } from 'react-icons/md';
import { CategoryDefine } from '../../279map-common';

type Props = {
    category: string;
    existCategories: CategoryDefine[];
    outline?: boolean;      // trueの場合、アウトライン表現
    click?: () => void;    // クリック時のコールバック。
    onDeleteClick?: () => void; // Deleteボタン押下時のコールバック。
}

export default function CategoryBadge(props: Props) {
    const onClick = useCallback(() => {
        if (props.click) {
            props.click();
        }
    }, [props]);

    const category = useMemo((): CategoryDefine | undefined => {
        return props.existCategories.find(c => c.name === props.category);
    }, [props.category, props.existCategories]);

    const style = useMemo((): CSSProperties => {
        const color = category ? category.color : '#faa';
        if (props.outline) {
            return {
                borderColor: color,
                color: color,
            }
        } else {
            return {
                backgroundColor: colorWithAlpha(color, .7),
            }
        }

    }, [props.outline, category]);

    const onDelete = useCallback(() => {
        if (props.onDeleteClick) {
            props.onDeleteClick();
        }
    }, [props]);

    return (
        <div className={`${styles.TagBadge} ${props.click!==undefined?styles.clickable:''} ${props.outline ? styles.outline : ''}`} style={style} onClick={onClick}>
            <span>
                {props.category}
                {!category && '【新】'}
            </span>
            {props.onDeleteClick &&
                <span className={styles.DeleteIcon} onClick={onDelete}>
                    <MdClose />
                </span>
            }
        </div>
    );
}