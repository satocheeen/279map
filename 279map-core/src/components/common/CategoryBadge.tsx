import React, { CSSProperties, useCallback, useMemo } from 'react';
import styles from './CategoryBadge.module.scss';
import { MdClose } from 'react-icons/md';
import { CategoryItem } from '../../graphql/generated/graphql';
import tinycolor from 'tinycolor2';

type Props = {
    category: string;
    existCategories: CategoryItem[];
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

    const category = useMemo((): CategoryItem | undefined => {
        return props.existCategories.find(c => c.value === props.category);
    }, [props.category, props.existCategories]);

    const style = useMemo((): CSSProperties => {
        const color = category ? category.color : '#faa';
        const textColor = tinycolor(color).isLight() ? '#222' : '#fff';
        if (props.outline) {
            return {
                borderColor: color,
                color: color,
            }
        } else {
            return {
                backgroundColor: tinycolor(color).setAlpha(.8).toHexString(),
                color: textColor,
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