import React, { useCallback, useContext, useRef } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';

type Props = {
}

export default function LinkContentDriver(props: Props) {
    const { getMap, addConsole } = useContext(DriverContext);
    const contentDsIdRef = useRef<HTMLInputElement>(null);
    const contentIdRef = useRef<HTMLInputElement>(null);
    const itemDsIdRef = useRef<HTMLInputElement>(null);
    const itemIdRef = useRef<HTMLInputElement>(null);

    const handleExecute = useCallback(async() => {
        const res = await getMap()?.linkContent({
            id: {
                dataSourceId: contentDsIdRef.current?.value ?? '',
                id: contentIdRef.current?.value ?? '',
            },
            parent: {
                type: 'item',
                id: {
                    dataSourceId: itemDsIdRef.current?.value ?? '',
                    id: itemIdRef.current?.value ?? '',
                }
            }
        });

        addConsole('linkContent result', res);

    }, [getMap, addConsole])

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>コンテンツ割当て</div>
            <div>
                対象コンテンツ
                <label>
                    ID
                    <input type='text' ref={contentIdRef} />
                </label>
                <label>
                    datasourceID
                    <input type='text' ref={contentDsIdRef} />
                </label>
            </div>
            <div>
                割当先アイテム
                <label>
                    ID
                    <input type='text' ref={itemIdRef} />
                </label>
                <label>
                    datasourceID
                    <input type='text' ref={itemDsIdRef} />
                </label>
            </div>
            <button onClick={handleExecute}>実行</button>
        </div>
    );
}