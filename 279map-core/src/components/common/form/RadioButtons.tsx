import React, { useRef, useCallback } from 'react';
import styles from './RadioButtons.module.scss';

type Props = {
    items: {
        label: string;
        value: string;
    }[];
    value: string;
    onChange: (val: string) => void;
}

let instanceCnt = 0;
export default function RadioButtons(props: Props) {
    const id = useRef('radio-buttons-' + ++instanceCnt);
    const onChange = useCallback((val: string) => {
        props.onChange(val);
    }, [props]);

    return (
        <div className={styles.Groups}>
            {props.items.map((item, index) => {
                const myId = id + '-' + index;
                const checked = props.value === item.value;
                return (
                    <div key={item.value} className={styles.RadioArea}>
                        <input type='radio' id={myId} checked={checked} onClick={() => onChange(item.value)} />
                        <label htmlFor={myId}>
                            {item.label}
                        </label>
                    </div>
                )
            })}
        </div>
    )
}