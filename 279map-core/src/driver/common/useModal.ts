import React, { ReactElement, useCallback, useImperativeHandle, useRef, useState } from "react";

export interface ModalHandler<PARAM, RESULT> {
    show: (param: PARAM) => Promise<RESULT>;
}

type Option<PARAM> = {
    handleShow?: (param: PARAM) => void;
    handleBeforeClose?: (param: PARAM) => void;
}
export default function useModal<PARAM, RESULT>(ref: React.ForwardedRef<ModalHandler<PARAM, RESULT>>, opt?: Option<PARAM>) {
    const [ open, setOpen ] = useState(false);
    const resolveCallbackRef = useRef<null | ((result: any) => void)>(null);
    const [ param, setParam ] = useState<PARAM>();

    useImperativeHandle(ref, () => ({
        show(param: PARAM) {
            setOpen(true);
            setParam(param);
            if (opt?.handleShow) {
                opt.handleShow(param);
            }
            return new Promise<RESULT>((resolve) => {
                resolveCallbackRef.current = resolve;
            });
        }
    }));

    const close = useCallback((result: RESULT) => {
        setOpen(false);
        if (opt?.handleBeforeClose) {
            opt.handleBeforeClose(param as PARAM);
        }
        if (resolveCallbackRef.current) {
            resolveCallbackRef.current(result);
        }

    }, [opt, param]);

    return {
        /** モーダル表示状態かどうか */
        isOpen: open,
        /** モーダルを閉じる際に呼び出す */
        close,
        /** show時に渡されたパラメタ */
        param,
    }
}

type ModalComponent<P, PARAM, RESULT> = (props: P, ref: React.ForwardedRef<ModalHandler<PARAM, RESULT>>) => ReactElement<P> | null;

export function createModal<PROPS, PARAM, RESULT>(component: ModalComponent<PROPS, PARAM, RESULT>) {
    return React.forwardRef(component);
}
