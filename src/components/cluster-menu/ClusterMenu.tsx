import React, { useEffect, useRef, useMemo, useContext } from 'react';
import { Map, Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';

type Props = {
    map: Map;
    position: Coordinate; // メニュー表示位置
    itemIds: string[];
}

export default function ClusterMenu(props: Props) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const overlay = new Overlay({
            positioning: 'bottom-left', //OverlayPositioning.BOTTOM_CENTER,
            offset: [-45, -20],
            stopEvent: true,
            element: elementRef.current as HTMLDivElement,
        });
        props.map.addOverlay(overlay);
        overlay.setPosition(props.position);

        return () => {
            props.map.removeOverlay(overlay);
        }
    }, [props.map, props.position]);

    return (
        <div>
            <div ref={elementRef} className={styles.Container}>
                {props.itemIds.map(id => {
                    return (
                        <MenuItem key={id} id={id} />
                    );
                })}
            </div>
        </div>
    );
}

type MenuItemProp = {
    id: string;
}
function MenuItem(props: MenuItemProp) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const itemName = useMemo(() => {
        return itemMap[props.id].name;
    }, [itemMap, props.id]);

    return (
        <li className={styles.MenuItem}>{itemName}</li>
    );
}