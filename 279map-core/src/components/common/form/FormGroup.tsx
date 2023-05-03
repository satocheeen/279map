import React, { useRef } from 'react';
import styles from './FormGroup.module.scss';

type Props = {
    label: string;
    children: JSX.Element;
}

let instanceCnt = 0;
/**
 * ラベルとフォームアイテム
 * @param props 
 * @returns 
 */
export default function FormGroup(props: Props) {
    const id = useRef('form-group-' + ++instanceCnt);

    const inputElement = React.cloneElement(props.children, {
        id: id.current,
    });
    return (
        <div className={styles.Container}>
            <label htmlFor={id.current} className={styles.Label}>
                {props.label}
            </label>
            {inputElement}
        </div>
    );
}