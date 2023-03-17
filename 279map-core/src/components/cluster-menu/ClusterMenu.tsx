import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Map, Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import useIcon from '../../store/useIcon';
import AddContentMenu from '../popup/AddContentMenu';
import { Auth } from '../../279map-common';

/**
 * Cluster items' menu for selecting an item.
 * 重畳選択メニュー
 */

type Props = {
    map: Map;

    // the menu position
    position: Coordinate;

    // the menu items' ID. 
    itemIds: string[];

    onSelect?: (id: string) => void;
    onClose?: () => void;
}

export default function ClusterMenu(props: Props) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const overlay = new Overlay({
            positioning: 'bottom-left', //OverlayPositioning.BOTTOM_CENTER,
            offset: [-45, -20],
            stopEvent: true,
            element: elementRef.current as HTMLDivElement,
            className: styles.ContainerWrapper,
        });
        props.map.addOverlay(overlay);
        overlay.setPosition(props.position);

        return () => {
            props.map.removeOverlay(overlay);
        }
    }, [props.map, props.position]);

    const onItemClick = useCallback((id: string) => {
        if (props.onSelect) {
            props.onSelect(id);
        }
    }, [props]);

    return (
        <div>
            <div ref={elementRef} className={styles.Container}>
                {props.itemIds.map(id => {
                    return (
                        <MenuItem key={id} id={id} 
                            onClick={() => onItemClick(id)}
                            onClose={props.onClose} />
                    );
                })}
            </div>
        </div>
    );
}

type MenuItemProp = {
    id: string;
    onClick?: () => void;
    onClose?: () => void;
}
function MenuItem(props: MenuItemProp) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const item = useMemo(() => itemMap[props.id], [props.id, itemMap]);

    const { getIconDefine } = useIcon();

    const iconDefine= useMemo(() => {
        if (!item.geoProperties) {
            return getIconDefine();
        }
        if (!('icon' in item.geoProperties)) {
            // TODO: 空を設定
            return getIconDefine();
        }
        return getIconDefine(item.geoProperties.icon);

    }, [getIconDefine, item]);

    const iconImagePath = useMemo(() => iconDefine.imagePath, [iconDefine]);

    const hasContent =useMemo(() => {
        return item.contents.length > 0;
    }, [item]);

    const itemName = useMemo(() => {
        if (!item) return ''
        return item.name;
    }, [item]);

    const editableAuthLv = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap?.authLv === Auth.Edit;
    });
    const showAddContentMenu = useMemo(() => {
        return editableAuthLv && !hasContent;
    }, [editableAuthLv, hasContent]);

    const onAddContentMenuClicked = useCallback(() => {
        if (props.onClose) {
            props.onClose();
        }
    }, [props]);

    return (
        <li className={styles.MenuItem} onClick={props.onClick}>
            <img src={iconImagePath} />
            <span className={styles.NameArea}>
                <span>{itemName}</span>
                {showAddContentMenu &&
                    <AddContentMenu target={{itemId: props.id}} onClick={onAddContentMenuClicked} />
                }
            </span>
        </li>
    );
}
