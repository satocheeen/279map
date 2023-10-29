import React, { useEffect, useRef, useMemo } from 'react';
import styles from './Modal.module.scss';
import { MdClose } from 'react-icons/md';
import Overlay from '../spinner/Overlay';

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

    // EventListener内で最新のprops.show情報を取得するために用意
    const showRef = useRef(props.show);
    useEffect(() => {
        showRef.current = props.show;
    }, [props.show]);

    useEffect(() => {
        if (props.show) {
            if (closing.current) {
                closing.current = false;
            }
            if (myRef.current?.open) return;
            myRef.current?.showModal();
            myRef.current?.addEventListener('cancel',(evt) => {
                // ESCキーなどで強制クローズされた場合
                if (props.onCloseBtnClicked) {
                    props.onCloseBtnClicked();
                }
                evt.preventDefault();
            })
        } else {
            // if (!myRef.current?.open) return;
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

    const showSpinner = useMemo(() => {
        if (!props.spinner) return false;
        return true;
    }, [props.spinner]);

    const spinnerMessage = useMemo(() => {
        if (typeof props.spinner === 'string') {
            return props.spinner;
        } else {
            return '処理中...';
        }
    }, [props.spinner]);

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
            {showSpinner &&
                <Overlay spinner message={spinnerMessage} />
            }
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
