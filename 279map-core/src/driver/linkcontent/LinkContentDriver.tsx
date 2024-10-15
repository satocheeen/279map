import React, { useCallback, useContext, useRef } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';

type Props = {
}

export default function LinkContentDriver(props: Props) {
    const { getMap, addConsole } = useContext(DriverContext);
    const contentIdRef = useRef<HTMLInputElement>(null);
    const itemIdRef = useRef<HTMLInputElement>(null);

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>コンテンツ割当て/解除</div>
            対象コンテンツID
            <input type='text' ref={contentIdRef} />
            割当先アイテムID
            <input type='text' ref={itemIdRef} />
            <div>
                {/* <button onClick={handleLink}>割当て</button> */}
                {/* <button onClick={handleUnLink}>解除</button> */}
            </div>
        </div>
    );
}