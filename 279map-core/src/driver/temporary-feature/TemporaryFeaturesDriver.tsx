import React, { useCallback, useContext } from 'react';
import { DriverContext } from '../TestMap';
import { FeatureType } from '../../entry';
import styles from '../TestMap.module.scss';
import mystyles from './TemporaryFeaturesDriver.module.scss';

type Props = {
}

const placeholder = `[
    {
        "id": "hoge",
        "geoJson": {"type":"Point","coordinates":[135.8911869873463,35.29149007672131]}
    }
]`;
export default function TemporaryFeaturesDriver(props: Props) {
    const { getMap, addConsole, setTemporaryGeoJsons } = useContext(DriverContext);

    const handleDrawTemporaryFeature = useCallback(async() => {
        const result = await getMap()?.drawTemporaryFeature(FeatureType.STRUCTURE);
        addConsole('drawTemporaryFeature', result);
    }, [getMap, addConsole])

    const handleGeoJsonChanged = useCallback((text: string) => {
        try {
            const json = JSON.parse(text);
            setTemporaryGeoJsons(json);

        } catch(err) {
            console.warn(err);
            setTemporaryGeoJsons(undefined)
        }
    }, [setTemporaryGeoJsons])

    return (
        <div className={mystyles.Container}>
            <div className={styles.PropName}>一時描画API</div>
            <button onClick={handleDrawTemporaryFeature}>drawTemporaryFeature</button>

            <div className={styles.PropName}>一時描画GeoJson</div>
            <textarea rows={3} placeholder={placeholder} onChange={evt => handleGeoJsonChanged(evt.target.value)} />
        </div>
    );
}