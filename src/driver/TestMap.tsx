import { api, MapKind } from '279map-common';
import React, { useState, useCallback } from 'react';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';

/**
 * for Development
 */
const props = {
    mapServer: {
        // domain: 'otakaramap.satocheeen.com',
        domain: 'localhost',
        ssl: true,
    },
    mapId: 'test',
    iconDefine: [
        {
            id: 'pin',
            imagePath: '/icon/pin.png',
            useMaps: [MapKind.Real],
            menuViewCustomCss: {
                filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
            },
            defaultColor: '#aaa',
        },
        {
            id: 'school',
            imagePath: '/icon/house.png',
            useMaps: [MapKind.Virtual],
        },
    ],
        
};

export default function TestMap() {
    const [ cnt, setCnt ] = useState(0);
    const onConnect = useCallback((mapDefine: api.ConnectResult) => {
        console.log('connect', mapDefine);
        setMapKind(mapDefine.defaultMapKind);
        setCnt(cnt + 1);
    }, [cnt]);

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    const onRadio = useCallback((kind: MapKind) => {
        setMapKind(kind);
    }, []);

    // switch popup
    const [ disabledPopup, setDisablePopup] = useState(false);
    const onDisalbedPopup = useCallback((val: boolean) => {
        setDisablePopup(val);
    }, []);

    // callbacks
    const onSelect = useCallback((ids: string[]) => {
        console.log('onSelect', ids, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

    const onUnselect = useCallback(() => {
        console.log('onUnselect');
    }, []);

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    <h3>地図種別</h3>
                    <label>
                        日本地図
                        <input type="radio" checked={mapKind===MapKind.Real} onClick={() => onRadio(MapKind.Real)} />
                    </label>
                    <label>
                        村マップ
                        <input type="radio" checked={mapKind===MapKind.Virtual} onClick={() => onRadio(MapKind.Virtual)} />
                    </label>
                </div>
                <div className={styles.Col}>
                    <h3>Popup</h3>
                    <label>
                        enabled
                        <input type="radio" checked={!disabledPopup} onClick={() => onDisalbedPopup(false)} />
                    </label>
                    <label>
                        disabled
                        <input type="radio" checked={disabledPopup} onClick={() => onDisalbedPopup(true)} />
                    </label>
                </div>
            </div>
            <div className={styles.Map}>
                <TsunaguMap {...props} mapKind={mapKind} disablePopup={disabledPopup}
                    onConnect={onConnect}
                    onSelect={onSelect} onUnselect={onUnselect} />
            </div>
        </>
    );
}