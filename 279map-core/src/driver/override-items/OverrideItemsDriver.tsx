import React, { useCallback, useContext, useState } from 'react';
import { FeatureType, OverrideItem } from '../../entry';
import { DriverContext } from '../TestMap';
import mystyles from './OverrideItemsDriver.module.scss';
import styles from '../TestMap.module.scss';

type Props = {
}

const placeholder = `[{
    "type": "new",
    "datasourceId": "xxx",
    "name": "xxx",
    "geometry": {"type":"Point","coordinates":[135.8911869873463,35.29149007672131]}
    "geoProperties": {}
}]`
export default function OverrideItemsDriver(props: Props) {
    const { setOverrideItems, getMap, addConsole } = useContext(DriverContext);

    const handleDrawTemporaryFeature = useCallback(async() => {
        const result = await getMap()?.drawTemporaryFeature(FeatureType.STRUCTURE);
        addConsole('drawTemporaryFeature', result);
    }, [getMap, addConsole])

    const handleChangeOverrideItemsText = useCallback((text: string) => {
        try {
            const value = JSON.parse(text) as OverrideItem[];
            setOverrideItems(value);
        } catch(err) {
            setOverrideItems(undefined);
        }
    }, [setOverrideItems])

    return (
        <div className={mystyles.Container}>
            <div className={styles.PropName}>一時アイテム関連</div>
            <button onClick={handleDrawTemporaryFeature}>drawTemporaryFeature</button>
            <label>
                OverrideItems
                <textarea placeholder={placeholder} rows={3}
                    onChange={evt=>handleChangeOverrideItemsText(evt.target.value)} />
            </label>
        </div>
    );
}