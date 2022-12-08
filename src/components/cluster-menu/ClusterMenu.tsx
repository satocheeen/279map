import React, { useEffect, useRef, useMemo, useContext } from 'react';
import { Map, Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';

type Props = {
    map: Map;
    position: Coordinate; // メニュー表示位置
}

export default function ClusterMenu(props: Props) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const overlay = new Overlay({
            positioning: 'bottom-center', //OverlayPositioning.BOTTOM_CENTER,
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
                HogeHoge
            </div>
        </div>
    );
}