import React, { useRef, useCallback } from 'react';
import Tooltip from '../common/tooltip/Tooltip';
import styles from './PopupMenuIcon.module.scss';

type Props = {
    id?: string;
    tooltip?: string;
    onClick?: () => void;
    children: React.ReactElement;
}

let maxId = 0;
/**
 * ポップアップ内で使用するアイコン
 * @param props 
 * @returns 
 */
export default function PopupMenuIcon(props: Props) {
    const id = useRef(props.id ?? 'popup-menu-icon-'+maxId++);

    const onIconClick = useCallback((evt: React.MouseEvent) => {
        evt.stopPropagation();
        if (props.onClick) {
            props.onClick();
        }
    }, [props]); 

    const onMouseEnterIcon = useCallback(() => {
        if (!props.tooltip) return;
    }, [props.tooltip]);

    return (
        <>
            <span id={id.current} className={styles.Icon} onClick={onIconClick}
                onMouseEnter={onMouseEnterIcon}>
                {props.children}
            </span>
            <Tooltip anchorId={id.current} content={props.tooltip} place="top" />
        </>
    );
}
