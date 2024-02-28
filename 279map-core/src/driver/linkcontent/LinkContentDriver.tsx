import React, { useCallback, useContext, useRef } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';
import { DataId } from '../../entry';

type Props = {
}

export default function LinkContentDriver(props: Props) {
    const { getMap, addConsole } = useContext(DriverContext);
    const contentIdRef = useRef<HTMLInputElement>(null);
    const itemIdRef = useRef<HTMLInputElement>(null);

    const handleLink = useCallback(async() => {
        const contentId = JSON.parse(contentIdRef.current?.value ?? '') as DataId;
        const itemId = JSON.parse(itemIdRef.current?.value ?? '') as DataId;
        const res = await getMap()?.linkContent({
            id: contentId,
            parent: {
                type: 'item',
                id: itemId,
            }
        });

        addConsole('linkContent result', res);

    }, [getMap, addConsole])

    const handleUnLink = useCallback(async() => {
        const contentId = JSON.parse(contentIdRef.current?.value ?? '') as DataId;
        const itemId = JSON.parse(itemIdRef.current?.value ?? '') as DataId;
        try {
            const res = await getMap()?.unlinkContent({
                id: contentId,
                parent: {
                    type: 'item',
                    id: itemId,
                }
            });
    
            addConsole('unlinkContent result', res);
    
        } catch(e) {
            addConsole('unlinkContent error', e);

        }

    }, [getMap, addConsole])

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>コンテンツ割当て/解除</div>
            対象コンテンツID(JSON)
            <input type='text' ref={contentIdRef} />
            割当先アイテムID(JSON)
            <input type='text' ref={itemIdRef} />
            <div>
                <button onClick={handleLink}>割当て</button>
                <button onClick={handleUnLink}>解除</button>
            </div>
        </div>
    );
}