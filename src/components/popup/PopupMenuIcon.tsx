import React, { useMemo, useRef, useCallback, useState } from 'react';
import styles from './PopupMenuIcon.module.scss';
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import { useAppDispatch } from '../../store/configureStore';
import { operationActions } from '../../store/operation/operationSlice';

type SubMenu<T extends string> = {
    items: {
        text: string;
        value: T;
    }[];
    onClick?: (value: T) => void;
}
type Props = {
    tooltip?: string;
    onClick?: () => void;
    children: React.ReactElement;
    submenu?: SubMenu<any>;
    modal?:boolean;
}

let maxId = 0;
/**
 * ポップアップ内で使用するアイコン
 * @param props 
 * @returns 
 */
export default function PopupMenuIcon(props: Props) {
    const id = useRef('popup-menu-icon-'+maxId++);
    const [isShowSubMenu, setShowSubMenu] = useState(false);
    const dispatch = useAppDispatch();

    const onIconClick = useCallback((evt: React.MouseEvent) => {
        evt.stopPropagation();
        if (!props.submenu && props.onClick) {
            props.onClick();
        } else {
            if (!isShowSubMenu) {
                setShowSubMenu(true);
                evt.stopPropagation();
            } else {
                setShowSubMenu(false);
            }
        }
    }, [props, isShowSubMenu]); 

    const onMouseEnterIcon = useCallback(() => {
        if (!props.tooltip) return;
        dispatch(operationActions.setTooltip({
            anchorId: id.current,
            content: props.tooltip,
            modal: props.modal,
        }));
    }, [props.tooltip, props.modal, dispatch]);

    const icon = useMemo(() => {
        return (
            <span id={id.current} className={styles.Icon} onClick={onIconClick}
                onMouseEnter={onMouseEnterIcon}>
                {props.children}
            </span>
        );
    }, [props, onIconClick, onMouseEnterIcon]);

    const onSubMenuClick = useCallback((val: string) => {
        if (!props.submenu?.onClick) {
            return;
        }
        setShowSubMenu(false);
        props.submenu.onClick(val);
    }, [props.submenu]);

    const subMenu = useMemo(() => {
        if (!props.submenu) {
            return null;
        }
        return (
            <Tooltip anchorId={id.current} place="right" isOpen={isShowSubMenu} className={styles.PopupMenu}>
                <ul>
                    {props.submenu.items.map(item => {
                        return (
                            <li key={item.value} onClick={()=>onSubMenuClick(item.value)}>{item.text}</li>
                        )
                    })}
                </ul>
            </Tooltip>
        );
    }, [props.submenu, onSubMenuClick, isShowSubMenu]);

    return (
        <>
            {icon}
            {subMenu}
        </>
    );
}
