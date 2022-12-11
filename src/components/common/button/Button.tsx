import React, { useCallback } from 'react';
import styles from './Button.module.scss';

type Props = {
    variant: 'primary' | 'secondary';
    onClick?: () => void;
    disabled?: boolean;
    children: string;
}

export default function Button(props: Props) {
    const onClick = useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props]);

    return (
        <button className={`${styles.Button} ${styles[props.variant]}`} onClick={onClick} disabled={props.disabled}>
            {props.children}
        </button>
    );
}