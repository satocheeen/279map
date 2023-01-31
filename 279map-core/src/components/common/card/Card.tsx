import React, { useCallback } from 'react';
import styles from './Card.module.scss';

type Props = {
    title: string;
    breadcrumb?: string[];
    imageUrl?: string;
    overview?: string;
    onClick?: () => void;
}

export default function Card(props: Props) {
    const onClick = useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props]);

    return (
        <div className={`${styles.Card} ${props.onClick ? styles.Clickable : ''}`} onClick={onClick}>
            <div className={styles.Image}>
                {props.imageUrl ?
                    <img src={props.imageUrl} />
                    :
                    <div className={styles.NoImg} />
                }
            </div>
            <div className={styles.Body}>
                <nav className={styles.BreadCrumb}>
                    <ol>
                        {props.breadcrumb &&
                            props.breadcrumb.map((bc, index) => {
                                return (
                                    <li key={index}>{bc}</li>
                                )
                            })}
                    </ol>
                </nav>
                <div className={styles.Title}>{props.title}</div>
                <div className={styles.Overview}>{props.overview}</div>
            </div>
        </div>
    );
}