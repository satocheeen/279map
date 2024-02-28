import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DriverContext } from '../TestMap';
import styles from '../TestMap.module.scss';
import { DataId } from '../../entry';
import myStyles from './ItemController.module.scss';

type Props = {
}

export default function ItemController(props: Props) {
    const { getMap, loadedItems, addConsole } = useContext(DriverContext);
    const [ itemIdValue, setItemIdValue ] = useState('');

    const itemId = useMemo(():DataId | undefined => {
        try {
            const itemId = JSON.parse(itemIdValue) as DataId;
            if (!itemId.dataSourceId) return;
            if (!itemId.id) return;
            return itemId;

        } catch(e) {
            return;
        }

    }, [itemIdValue]);

    const result = useMemo(() => {
        if (!itemId) return '';
        const hit = loadedItems.find(item => item.id.dataSourceId === itemId.dataSourceId && item.id.id === itemId.id);
        if (!hit) return '該当アイテムなし';
        return JSON.stringify(hit, undefined, 2);
    }, [itemId, loadedItems]);

    const handleFocusItem = useCallback(() => {
        if (!itemId) return;
        getMap()?.focusItem(itemId, {
            zoom: true,
            select: true,
        });
    }, [itemId, getMap]);

    const handleLoadContents = useCallback(async() => {
        if (!itemId) return;
        try {
            const res = await getMap()?.loadContentsInItem(itemId);
            addConsole('loadContentsInItem result', res);
    
        } catch(e) {
            addConsole('loadContentsInItem failed.', e);
        }
    }, [itemId, getMap, addConsole]);

    return (
        <div>
            <div className={styles.PropName}>アイテム情報表示</div>
            <div className={myStyles.Container}>
                <div>
                    <label>
                        ItemID(JSON)
                        <input type='text' value={itemIdValue} onChange={evt=>setItemIdValue(evt.target.value)} />
                    </label>
                    アイテム情報
                    <textarea readOnly value={result} rows={3} />
                </div>
                <div>
                    <button onClick={handleFocusItem}>Focus Item</button>
                    <button onClick={handleLoadContents}>Load Contents</button>
                </div>
            </div>
        </div>
    );
}