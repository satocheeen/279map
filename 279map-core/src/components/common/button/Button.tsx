import React, { useCallback } from 'react';
import styles from './Button.module.scss';

type Props = {
    id?: string;
    variant: 'primary' | 'secondary' | 'link';
    onClick?: (evt: React.MouseEvent) => void;
    disabled?: boolean;
    children: (JSX.Element | string) | (JSX.Element | string)[];
}

export default function Button(props: Props) {
    const onClick = useCallback((evt: React.MouseEvent) => {
        if (props.onClick) {
            props.onClick(evt);
        }
    }, [props]);

    return (
        <button id={props.id} className={`${styles.Button} ${styles[props.variant]}`} onClick={onClick} disabled={props.disabled}>
            {props.children}
        </button>
    );
}