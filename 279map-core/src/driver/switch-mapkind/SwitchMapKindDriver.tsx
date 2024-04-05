import React, { useCallback, useContext } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './SwitchMapKindDriver.module.scss';
import { DriverContext } from '../TestMap';
import { MapKind } from '../../entry';

type Props = {
}

export default function SwitchMapKindDriver(props: Props) {
    const { getMap, mapKind } = useContext(DriverContext);

    const switchMapKind = useCallback((mapKind: MapKind) => {
        getMap()?.switchMapKind(mapKind);
    }, [getMap])

    return (
        <div className={myStyles.Container}>
            <div className={styles.PropName}>地図種別</div>
            <label>
                <input type="radio" checked={mapKind===MapKind.Real} onChange={() => switchMapKind(MapKind.Real)} />
                日本地図
            </label>
            <label>
                <input type="radio" checked={mapKind===MapKind.Virtual} onChange={() => switchMapKind(MapKind.Virtual)} />
                村マップ
            </label>
        </div>
);
}