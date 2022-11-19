import React, { useMemo, useRef, useCallback, useState } from 'react';
import { Overlay, OverlayTrigger, Popover, Tooltip } from 'react-bootstrap';
import styles from './PopupMenuIcon.module.scss';

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
}

/**
 * ポップアップ内で使用するアイコン
 * @param props 
 * @returns 
 */
export default function PopupMenuIcon(props: Props) {
    const iconRef = useRef(null);
    const [isShowSubMenu, setShowSubMenu] = useState(false);

    const onIconClick = useCallback((evt: React.MouseEvent) => {
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

    const icon = useMemo(() => {
        return (
            <span ref={iconRef} className={styles.Icon} onClick={onIconClick}>
                {props.children}
            </span>
        );
    }, [props, onIconClick]);

    const iconWithToolTip = useMemo(() => {
        if (props.tooltip) {
            return (
                <OverlayTrigger overlay={
                    <Tooltip>{props.tooltip}</Tooltip>
                }>
                    {icon}
                </OverlayTrigger>
            );
        } else {
            return icon;
        }
    }, [props.tooltip, icon]);

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
            <Popover id="popover-contained">
                <Popover.Body bsPrefix={styles.PopupMenu}>
                    <ul className={styles.PopupMenu}>
                        {props.submenu.items.map(item => {
                            return (
                                <li key={item.value} onClick={()=>onSubMenuClick(item.value)}>{item.text}</li>
                            )
                        })}
                    </ul>
                </Popover.Body>
            </Popover>
        );
    }, [props.submenu, onSubMenuClick]);

    return (
        <>
            {iconWithToolTip}
            {props.submenu &&
                <Overlay target={iconRef.current} show={isShowSubMenu} placement="right">
                    {({ placement, arrowProps, show: _show, popper, ...props }) => (
                        <div
                            {...props}
                        >
                        {subMenu}
                    </div>
                    )}
                </Overlay>
            }
        </>
    );
}