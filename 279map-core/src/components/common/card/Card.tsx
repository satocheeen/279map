import React, { useCallback, useMemo } from 'react';
import styles from './Card.module.scss';
import MyImage from '../image/MyImage';

type Props = {
    title: string;
    breadcrumb?: string[];
    imageUrl?: string;
    imageId?: string;
    overview?: string;
    onClick?: () => void;
}

export default function Card(props: Props) {
    const onClick = useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props]);

    const imageElement = useMemo(() => {
        if (props.imageId) {
            return (
                <MyImage id={props.imageId} alt="card image" />
            )
        } else if (props.imageUrl) {
            return (
                <img src={props.imageUrl} />
            )
        } else {
            return (
                <div className={styles.NoImg} />
            )
        }
    }, [props.imageId, props.imageUrl])

    return (
        <div className={`${styles.Card} ${props.onClick ? styles.Clickable : ''}`} onClick={onClick}>
            <div className={styles.Image}>
                {imageElement}
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