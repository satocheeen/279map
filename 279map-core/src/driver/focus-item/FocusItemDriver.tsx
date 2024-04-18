import React, { useCallback, useContext, useState } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';
import mystyles from './FocusItemDriver.module.scss';

type Props = {
}

export default function FocusItemDriver(props: Props) {
    const { getMap } = useContext(DriverContext);
    const [ mode, setMode ] = useState<'item'|'temporary'>('item');
    const [ idText, setIdText ] = useState('');
    const [ zoom, setZoom ] = useState(false);
    const [ select, setSelect ] = useState(false);

    const handleFocusItem = useCallback(() => {
        if (mode === 'item') {
            const itemId = JSON.parse(idText);
            getMap()?.focusItem({
                target: {
                    type: 'item',
                    itemId,
                },
                zoom,
                select,
            })
        } else {
            getMap()?.focusItem({
                target: {
                    type: 'temporary',
                    id: idText,
                },
                zoom,
                select,
            })
        }
    }, [idText, getMap, mode, select, zoom]);


    return (
        <div className={mystyles.Container}>
            <div className={styles.PropName}>Focus Item</div>
            <div>
                <label>
                    <input type='radio' name='focus-type' checked={mode==='item'} onChange={()=>setMode('item')}></input>
                    Item
                </label>
                <label>
                    <input type='radio' name='focus-type' checked={mode==='temporary'} onChange={()=>setMode('temporary')}></input>
                    Temporary
                </label>
            </div>
            <label>
                ID{mode==='item' ? '(JSON)' : ''}<br/>
                <textarea value={idText} onChange={evt=>setIdText(evt.target.value)} />
            </label>
            <div>
                <label>
                    <input type='checkbox' checked={zoom} onChange={evt=>setZoom(evt.target.checked)}></input>
                    Zoom
                </label>
                <label>
                    <input type='checkbox' checked={select} onChange={evt=>setSelect(evt.target.checked)}></input>
                    Select
                </label>
            </div>
            <button onClick={handleFocusItem}>focus item</button>
        </div>
    );
}