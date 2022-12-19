import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import OverlaySpinner from '../spinner/OverlaySpinner';
import styles from './Modal.module.scss';
import { MdClose } from 'react-icons/md';

type Props = {
    show: boolean;
    children: [HeaderItem, BodyItem, FooterItem];
    className?: string;
    spinner?: string | boolean; // trueまたは文字列の場合、Spinner表示。文字列の場合は、Spinner+メッセージ表示。
    closebtn?: boolean; // trueの場合、ヘッダに閉じるボタンを表示
    onClose?: () => void;   // callback when click close btn
}

export default function Modal(props: Props) {
    const myRef = useRef<HTMLDialogElement|null>(null);

    useEffect(() => {
        if (props.show) {
            if (myRef.current?.open) return;
            myRef.current?.showModal();
        } else {
            if (!myRef.current?.open) return;
            // wait for animation
            setTimeout(() => {
                myRef.current?.close();
            }, 300);
        }
    }, [props.show]);

    const header = useMemo(() => {
        return props.children.find(child => child.type === ModalHeader);
    }, [props.children]);

    const body = useMemo(() => {
        return props.children.find(child => child.type === ModalBody);
    }, [props.children]);

    const footer = useMemo(() => {
        return props.children.find(child => child.type === ModalFooter);
    }, [props.children]);

    const onClose = useCallback(() => {
        if (props.onClose) {
            props.onClose();
        }
    }, [props]);

    return (
        <dialog ref={myRef} className={`${styles.Dialog} ${props.show ? styles.Show : styles.Close}`}>
            <div className={styles.Header}>
                {header?.props.children}
                {props.closebtn &&
                    <span className={styles.Close} onClick={onClose}>
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
    children: JSX.Element | JSX.Element[];
}
export function ModalFooter(props: FooterProps) {
    return <></>
}
type FooterItem = ReturnType<typeof ModalFooter>
