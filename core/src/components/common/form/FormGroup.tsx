import React, { useMemo, useRef } from 'react';
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

    const inputElement = useMemo(() => {
        const originalClassName = props.children.props.className ?? '' as string;
        const className = originalClassName.length > 0 ? `${originalClassName} ${styles.Input}` : styles.Input;
        return React.cloneElement(props.children, {
            id: id.current,
            className,
        });
    }, [props.children]);

    return (
        <div className={styles.Container}>
            <label htmlFor={id.current} className={styles.Label}>
                {props.label}
            </label>
            {inputElement}
        </div>
    );
}