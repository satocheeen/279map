import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Select.module.scss';
import { useMounted } from '../../../util/useMounted';

type Props = {
    items: {
        value: string;
        name: string;
    }[];
    unselectable?: boolean; // true指定の場合、未選択項目を用意
    value: string | undefined;  // 選択値
    onSelect: (value: string | undefined) => void; // 未選択項目が選択された場合、undefinedを渡す
}
export default function Select(props: Props) {
    const [ currentValue, setCurrentValue ] = useState<string|undefined>();
    const onSelectCallbackRef = useRef(props.onSelect);
    useEffect(() => {
        onSelectCallbackRef.current = props.onSelect;
    }, [props]);

    /**
     * 初期化
     */
    useMounted(() => {
        if (!props.value && !props.unselectable) {
            // 未選択不許可でvalueが未設定の場合は、冒頭項目を選択状態にする
            if (props.items.length === 0) return;
            setCurrentValue(props.items[0].value);
        } else if (props.value) {
            setCurrentValue(props.value);
        }
    });

    const onSelect = useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value.length === 0 ? undefined : evt.target.value;
        setCurrentValue(value);
    }, []);

    useEffect(() => {
        onSelectCallbackRef.current(currentValue);
    }, [currentValue])

    return (
        <select className={styles.Select} onChange={onSelect} value={currentValue}>
            {props.unselectable &&
                <option></option>
            }
            {props.items.map(item => {
                return (
                    <option key={item.value} value={item.value}>
                        {item.name}
                    </option>
                )
            })}
        </select>
    );
}
