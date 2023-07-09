import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import useIcon from '../../store/useIcon';
import AddContentMenu from '../popup/AddContentMenu';
import { Auth, DataId } from '279map-common';
import { getMapKey } from '../../store/data/dataUtility';
import { useMap } from '../map/useMap';
import { BsImage } from 'react-icons/bs';

/**
 * Cluster items' menu for selecting an item.
 * 重畳選択メニュー
 */

type Props = {
    // the menu position
    position: Coordinate;

    // the menu items' ID. 
    itemIds: DataId[];

    onSelect?: (id: DataId) => void;
    onClose?: () => void;
}

export default function ClusterMenu(props: Props) {
    const { getMap } = useMap();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const map = getMap();
        if (!map) return;
        const overlay = new Overlay({
            positioning: 'bottom-left', //OverlayPositioning.BOTTOM_CENTER,
            offset: [-45, -20],
            stopEvent: true,
            element: elementRef.current as HTMLDivElement,
            className: styles.ContainerWrapper,
        });
        map.addOverlay(overlay);
        overlay.setPosition(props.position);

        return () => {
            map.removeOverlay(overlay);
        }
    }, [getMap, props.position]);

    const onItemClick = useCallback((id: DataId) => {
        if (props.onSelect) {
            props.onSelect(id);
        }
    }, [props]);

    return (
        <div>
            <div ref={elementRef} className={styles.Container}>
                {props.itemIds.map(id => {
                    return (
                        <MenuItem key={getMapKey(id)} id={id} 
                            onClick={() => onItemClick(id)}
                            onClose={props.onClose} />
                    );
                })}
            </div>
        </div>
    );
}

type MenuItemProp = {
    id: DataId;
    onClick?: () => void;
    onClose?: () => void;
}
function MenuItem(props: MenuItemProp) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const item = useMemo(() => itemMap[getMapKey(props.id)], [props.id, itemMap]);

    const { getIconDefine } = useIcon();

    const iconDefine = useMemo(() => {
        if (!item.geoProperties) {
            return getIconDefine();
        }
        if (!('icon' in item.geoProperties)) {
            // TODO: 空を設定
            return getIconDefine();
        }
        return getIconDefine(item.geoProperties.icon);

    }, [getIconDefine, item]);

    const hasContent = useMemo(() => {
        return item.contents.length > 0;
    }, [item]);

    const hasImage = useMemo(() => {
        return item.contents.some(c => c.hasImage);
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

    // const iconImagePath = useMemo(() => iconDefine.imagePath, [iconDefine]);


    return (
        <li className={styles.MenuItem} onClick={props.onClick}>
            {iconDefine.type === 'system' ?
                <img src={iconDefine.imagePath} />
                :
                <img src={iconDefine.imagePath} alt={'icon' + iconDefine.caption} />
            }
            <span className={styles.NameArea}>
                <span>{itemName}</span>
                {hasImage &&
                    <span className={styles.Icon}><BsImage /></span>
                }
                {showAddContentMenu &&
                    <AddContentMenu target={{itemId: props.id}} onClick={onAddContentMenuClicked} />
                }
            </span>
        </li>
    );
}
