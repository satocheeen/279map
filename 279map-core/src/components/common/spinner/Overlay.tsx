import React from 'react';
import Spinner from './Spinner';
import styles from './Overlay.module.scss';

type Props = {
    spinner?: boolean;
    message?: string;
    minimum?: boolean;  // trueの場合、画面をふさがない形でスピナー表示する
    children?: JSX.Element | string | never[] | false;
}

export default function Overlay(props: Props) {
    return (
        <div className={`${!props.minimum ? styles.Overlay : styles.MinOverlay}`}>
            <div className={styles.ProcessArea}>
                {props.spinner &&
                    <div className={styles.GraphSpinner}>
                        <Spinner size={props.minimum ? 'small' : 'normal'} />
                    </div>
                }
                {props.message &&
                    <p className={styles.Message}>{props.message}</p>
                }
            </div>
            {props.children}
        </div>
    );
}