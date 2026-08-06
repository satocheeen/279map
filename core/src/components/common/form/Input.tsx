import React, { useMemo } from 'react';
import styles from './Input.module.scss';

type Props = React.ComponentPropsWithRef<'input'>;
export default function Input(props: Props) {
    const className = useMemo(() => {
        // eslint-disable-next-line react/prop-types
        const originalClassName = props.className ?? '' as string;
        return originalClassName.length > 0 ? `${originalClassName} ${styles.Input}` : styles.Input;
    // eslint-disable-next-line react/prop-types
    }, [props.className]);

    return (
        <input {...props} className={className} />
    );
}