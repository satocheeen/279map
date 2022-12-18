import React, { useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { Map, Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';

type Props = {
    map: Map;
    position: Coordinate; // メニュー表示位置
    itemIds: string[];
    onSelect?: (id: string) => void;
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
                        <MenuItem key={id} id={id} onClick={() => onItemClick(id)} />
                    );
                })}
            </div>
        </div>
    );
}

type MenuItemProp = {
    id: string;
    onClick?: () => void;
}
function MenuItem(props: MenuItemProp) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const itemName = useMemo(() => {
        const item = itemMap[props.id];
        if (!item) return ''
        return item.name;
    }, [itemMap, props.id]);

    return (
        <li className={styles.MenuItem} onClick={props.onClick}>{itemName}</li>
    );
}