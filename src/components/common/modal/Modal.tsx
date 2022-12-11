import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.scss';

type Props = {
    show: boolean;
    children: [HeaderItem, BodyItem, FooterItem];
    className?: string;
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
