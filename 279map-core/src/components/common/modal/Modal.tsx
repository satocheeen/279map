import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import OverlaySpinner from '../spinner/OverlaySpinner';
import styles from './Modal.module.scss';
import { MdClose } from 'react-icons/md';

type Props = {
    show: boolean;
    children: [HeaderItem, BodyItem, FooterItem];
    className?: string;
    spinner?: string | boolean; // trueまたは文字列の場合、Spinner表示。文字列の場合は、Spinner+メッセージ表示。
    // closebtn?: boolean; // trueの場合、ヘッダに閉じるボタンを表示
    onCloseBtnClicked?: () => void;   // callback when click close btn
    onClosed?: () => void;  // callback when closing dialog finish.
}

export default function Modal(props: Props) {
    const myRef = useRef<HTMLDialogElement|null>(null);
    const closing = useRef(false);  // when closing dialog, seted tre.

    useEffect(() => {
        if (props.show) {
            if (closing.current) {
                closing.current = false;
            }
            if (myRef.current?.open) return;
            myRef.current?.showModal();

        } else {
            if (!myRef.current?.open) return;
            closing.current = true;
            // wait for animation
            setTimeout(() => {
                // if modal show again while closing, don't close.
                if (closing.current) {
                    myRef.current?.close();
                    closing.current = false;
                    if (props.onClosed) {
                        props.onClosed();
                    }
                }
            }, 300);
        }
    }, [props.show, props]);

    const header = useMemo(() => {
        return props.children.find(child => child.type === ModalHeader);
    }, [props.children]);

    const body = useMemo(() => {
        return props.children.find(child => child.type === ModalBody);
    }, [props.children]);

    const footer = useMemo(() => {
        return props.children.find(child => child.type === ModalFooter);
    }, [props.children]);

    return (
        <dialog ref={myRef} className={`${styles.Dialog} ${props.show ? styles.Show : styles.Close}`}>
            <div className={styles.Header}>
                {header?.props.children}
                {props.onCloseBtnClicked &&
                    <span className={styles.Close} onClick={props.onCloseBtnClicked}>
                        <MdClose />
                    </span>
                }
            </div>
            <div className={styles.Body}>
                {body?.props.children}
            </div>
            <div className={styles.Footer}>
                {footer?.props.children}
            </div>
            {(props.spinner && props.show) &&
                <OverlaySpinner message={typeof props.spinner === 'string' ? props.spinner : '処理中...'} />
            }
        </dialog>
    );
}

type HeaderProps = {
    children?: string | JSX.Element | JSX.Element[];
}
export function ModalHeader(props: HeaderProps) {
    return <></>
};
type HeaderItem = ReturnType<typeof ModalHeader>

type BodyProps = {
    children?: JSX.Element | JSX.Element[];
}
export function ModalBody(props: BodyProps) {
    return <></>
}
type BodyItem = ReturnType<typeof ModalBody>

type FooterProps = {
    children?: JSX.Element | JSX.Element[];
}
export function ModalFooter(props: FooterProps) {
    return <></>
}
type FooterItem = ReturnType<typeof ModalFooter>
