import React, { useEffect, useRef } from 'react';
import OverlaySpinner from '../spinner/OverlaySpinner';
import styles from './Modal.module.scss';

type Props = {
    show: boolean;
    children: [HeaderItem, BodyItem, FooterItem];
    className?: string;
    spinner?: string | boolean; // trueまたは文字列の場合、Spinner表示。文字列の場合は、Spinner+メッセージ表示。
}

export default function Modal(props: Props) {
    const myRef = useRef<HTMLDialogElement|null>(null);

    useEffect(() => {
        if (props.show) {
            if (myRef.current?.open) return;
            myRef.current?.showModal();
        } else {
            if (!myRef.current?.open) return;
            myRef.current?.close();
        }
    }, [props.show]);

    return (
        <dialog ref={myRef} className={styles.Dialog}>
            {props.children}
            {props.spinner &&
                <OverlaySpinner message={typeof props.spinner === 'string' ? props.spinner : undefined} />
            }
        </dialog>
    );
}

type HeaderProps = {
    children: string;
}
export function ModalHeader(props: HeaderProps) {
    return (
        <div className={styles.Header}>
            {props.children}
        </div>
    );
};
type HeaderItem = ReturnType<typeof ModalHeader>

type BodyProps = {
    children: JSX.Element | JSX.Element[];
}
export function ModalBody(props: BodyProps) {
    return (
        <div className={styles.Body}>
            {props.children}
        </div>
    )
}
type BodyItem = ReturnType<typeof ModalBody>

type FooterProps = {
    children: JSX.Element | JSX.Element[];
}
export function ModalFooter(props: FooterProps) {
    return (
        <div className={styles.Footer}>
            {props.children}
        </div>
    )
}
type FooterItem = ReturnType<typeof ModalFooter>
