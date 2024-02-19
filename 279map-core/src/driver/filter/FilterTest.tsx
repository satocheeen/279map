import React, { useCallback, useContext, useState } from 'react';
import styles from '../TestMap.module.scss';
import FilterCondition from './FilterCondition';
import { DriverContext } from '../TestMap';
import { Condition } from '../../entry';

type Props = {
}

/**
 * filterAPIテストコンポーネント
 */
export default function FilterTest(props: Props) {
    const { getMap, addConsole, filterUnmatchView, setFilterUnmatchView } = useContext(DriverContext);

    const handleFilter = useCallback(async(condition?: Condition) => {
        if (!condition) {
            getMap()?.clearFilter();
            return;
        };
        const result = await getMap()?.filter(condition);
        addConsole('filter result', result);
    }, [getMap, addConsole]);

    return (
        <div className={styles.Col}>
            <div className={styles.Row}>
                <div className={styles.PropName}>フィルタ</div>
                <label>
                    非表示
                    <input type="radio" checked={filterUnmatchView==='hidden'}
                            onChange={() => setFilterUnmatchView('hidden')} />
                </label>
                <label>
                    不透明
                    <input type="radio" checked={filterUnmatchView==='translucent'}
                            onChange={() => setFilterUnmatchView('translucent')} />
                </label>
            </div>
            <FilterCondition
                onChange={(filter) => handleFilter(filter)} />
        </div>
    );
}