import { api, MapKind } from '279map-common';
import React, { useState, useCallback } from 'react';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';

/**
 * for Development
 */
const props = {
    mapServerHost: 'localhost',
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

    // switch popup
    const [ disabledPopup, setDisablePopup ] = useState(false);

    const [ disabledLabel, setDisableLabel ] = useState(false);

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
                        <input type="radio" checked={mapKind===MapKind.Real} onClick={() => setMapKind(MapKind.Real)} />
                    </label>
                    <label>
                        村マップ
                        <input type="radio" checked={mapKind===MapKind.Virtual} onClick={() => setMapKind(MapKind.Virtual)} />
                    </label>
                </div>
                <PropRadio name='disabledPopup' value={disabledPopup} onChange={setDisablePopup} />
                <PropRadio name='disabledLabel' value={disabledLabel} onChange={setDisableLabel} />
            </div>
            <div className={styles.Map}>
                <TsunaguMap {...props} mapKind={mapKind}
                    disabledPopup={disabledPopup}
                    disabledLabel={disabledLabel}
                    onConnect={onConnect}
                    onSelect={onSelect} onUnselect={onUnselect} />
            </div>
        </>
    );
}

type PropRadioProps = {
    name: string;
    value: boolean;
    onChange: (val: boolean) => void;
}
function PropRadio(props: PropRadioProps) {
    return (
        <div className={styles.Col}>
            <h3>{props.name}</h3>
            <label>
                <input type="radio" checked={!props.value} onClick={() => props.onChange(false)} />
                false
            </label>
            <label>
                <input type="radio" checked={props.value} onClick={() => props.onChange(true)} />
                true
            </label>
        </div>
    )
}