import React, { useEffect, useRef, useMemo } from 'react';
import styles from './Modal.module.scss';
import { MdClose } from 'react-icons/md';
import { useProcessMessage } from '../spinner/useProcessMessage';
import { useWatch } from '../../../util/useWatch';

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
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

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

    const messageIdRef = useRef<number>();
    useWatch(() => {
        if (props.spinner && props.show) {
            const message = typeof props.spinner === 'string' ? props.spinner : '処理中...';
            messageIdRef.current = showProcessMessage({
                overlay: true,
                spinner: true,
                message
            });
        } else {
            if (messageIdRef.current) {
                hideProcessMessage(messageIdRef.current);
            }
        }
    }, [props.spinner, props.show])

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
        </dialog>
    );
}

type HeaderProps = {
    children?: string | JSX.Element | (JSX.Element | false)[];
}
function ModalHeader(props: HeaderProps) {
    return <></>
};
type HeaderItem = ReturnType<typeof ModalHeader>
Modal.Header = ModalHeader;

type BodyProps = {
    children?: string | JSX.Element | (JSX.Element | false)[] | null;
}
function ModalBody(props: BodyProps) {
    return <></>
}
Modal.Body = ModalBody;

type BodyItem = ReturnType<typeof ModalBody>

type FooterProps = {
    children?: string | JSX.Element | (JSX.Element | false)[];
}
function ModalFooter(props: FooterProps) {
    return <></>
}
type FooterItem = ReturnType<typeof ModalFooter>
Modal.Footer = ModalFooter;
