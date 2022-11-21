import { MapKind } from '279map-common';
import React, { useState, useCallback } from 'react';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';

/**
 * for Development
 */
const props = {
    mapServer: {
        domain: '279map.satocheeen.com',
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
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    const onRadio = useCallback((kind: MapKind) => {
        setMapKind(kind);
    }, []);

    const onSelect = useCallback((ids: string[]) => {
        console.log('onSelect', ids);
    }, []);

    const onUnselect = useCallback(() => {
        console.log('onUnselect');
    }, []);

    return (
        <>
            <div className={styles.Form}>
                <label>
                    日本地図
                    <input type="radio" checked={mapKind===MapKind.Real} onClick={() => onRadio(MapKind.Real)} />
                </label>
                <label>
                    村マップ
                    <input type="radio" checked={mapKind===MapKind.Virtual} onClick={() => onRadio(MapKind.Virtual)} />
                </label>
            </div>
            <div style={{height: '100vh', width: '100vw', border: '1px solid #aaa'}}>
                <TsunaguMap {...props} mapKind={mapKind} onSelect={onSelect} onUnselect={onUnselect} />
            </div>
        </>
    );
}