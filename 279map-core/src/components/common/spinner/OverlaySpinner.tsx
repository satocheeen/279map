import React from 'react';
import Spinner from './Spinner';
import styles from './OverlaySpinner.module.scss';

type Props = {
    message: string;
}

export default function OverlaySpinner(props: Props) {
    return (
        <div className={styles.SpinnerOverlay}>
            <div className={styles.GraphSpinner}>
                <Spinner />
            </div>
            <p>{props.message}</p>
        </div>
    )
}