import React, { ReactElement, useCallback } from 'react';
import styles from './ListGroup.module.scss';

type Props = {
    className?: string;
    children: (ReactElement<typeof ListItem> | boolean)[];
}

export default function ListGroup(props: Props) {
    return (
        <div className={`${styles.Group} ${props.className ?? ''}`}>
            {props.children}
        </div>
    );
}

type ItemProps = {
    onClick?: () => void;
    children: string | JSX.Element | (string | JSX.Element)[];
}
function ListItem(props: ItemProps) {
    const onClick = useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props]);
    return (
        <div className={styles.Item} onClick={onClick}>
            {props.children}
        </div>
    )
}

ListGroup.Item = ListItem;
