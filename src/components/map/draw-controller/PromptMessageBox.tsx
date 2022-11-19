import React, { useMemo } from 'react';
import { Button } from 'react-bootstrap';
import styles from './PromptMessageBox.module.scss';

type Props = {
    message: string;
    okname?: string,
    cancelname?: string;
    okdisabled?: boolean,   // trueの場合、ok無効
    cancel?: () => void;
    ok?: () => void;
    children?: JSX.Element | false;
}

export default function PromptMessageBox(props: Props) {
    let okBtn = null;

    const okCaption = useMemo(() => {
        return props.okname ?? 'OK';
    }, [props.okname]);

    const cancelCaption = useMemo(() => {
        return props.cancelname ?? 'Cancel';
    }, [props.cancelname]);

    if (props.ok !== undefined) {
        if (props.okdisabled) {
            okBtn = <Button variant="light" disabled>{okCaption}</Button>
        } else {
            okBtn = <Button variant="light" onClick={props.ok}>{okCaption}</Button>
        }
    }
    return (
        <div className={styles.PromptMessageBox}>
            <div className={styles.message}>
                {props.message}
            </div>
            {props.children !== undefined &&
                <div>{props.children}</div>
            }
            <div className={styles.BtnArea}>
                {okBtn}
                {props.cancel !== undefined &&
                    <Button variant="outline-light" onClick={props.cancel}>
                        {cancelCaption}
                    </Button>
                }
            </div>
        </div>
    );
}