import React, { useCallback, useContext } from 'react';
import { PropRadio } from './BasicSettingDriver';
import { DriverContext } from '../TestMap';
import styles from '../TestMap.module.scss';
import { TsunaguMapHandler } from '../../entry';

type Props = {
}

export default function BackgroundDriver(props: Props) {
    const { getMap } = useContext(DriverContext);

    const handleChange = useCallback((val: Parameters<TsunaguMapHandler['switchBackground']>[0]) => {
        getMap()?.switchBackground(val);
    }, [])

    return (
        <div className={styles.Col}>
            <PropRadio name='背景地図'
            direction='vertical'
                items={[
                    { label: 'Open Street Map', value: 'osm' },
                    { label: '国土地理院', value: 'japan' },
                    { label: '国土地理院 衛星画像', value: 'japan-photo' }
                ]}
                // default={defaultPopupMode}
                onChange={handleChange} />
        </div>
    );
}