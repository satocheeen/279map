import { useCallback } from "react";
import { atom, selector, useRecoilState, useSetRecoilState } from "recoil";

// オーバーレイ表示時に表示するボタン種別
export enum ButtonInProcess {
    Request = 'Request',    // 地図への登録申請
}
export type ProcessMessageType = {
    overlay: boolean;   // trueの場合、オーバーレイ表示。falseの場合、ユーザ操作を阻害しない位置に表示
    spinner: boolean;   // trueの場合、スピナー表示
    message?: string;
    button?: ButtonInProcess;   // メッセージ下に表示するボタン種別（overlay=trueの場合のみ有効）
}
type ProcessMessageWithID = ProcessMessageType & {
    id: number;
}
export const processMessageCounterState = atom<number>({
    key: 'processMessageCounterAtom',
    default: 0,
});

export const processMessagesState = atom<ProcessMessageWithID[]>({
    key: 'processMessagesAtom',
    default:[],
});

/**
 * オーバーレイ表示するかどうか
 */
export const isShowOverlayState = selector<boolean>({
    key: 'isShowOverlaySelector',
    get: ({ get }) => {
        const processMessages = get(processMessagesState);
        return processMessages.some(pm => pm.overlay);
    }
})

/**
 * スピナー表示するかどうか
 */
export const isShowSpinnerState = selector<boolean>({
    key: 'isShowSpinnerSelector',
    get: ({ get }) => {
        const processMessages = get(processMessagesState);
        return processMessages.some(pm => pm.spinner);
    }
})

/**
 * 表示するメッセージ。メッセージが存在しない場合は、undefined。
 */
export const processMessageState = selector<ProcessMessageWithID|undefined>({
    key: 'processMessageSelector',
    get: ({ get }) => {
        const processMessages = get(processMessagesState);
        return processMessages.find(pm => pm.message);
    }
})

export function useProcessMessage() {
    const [currentProcessCnt, setProcessCnt] = useRecoilState(processMessageCounterState);
    const setProcessMessages = useSetRecoilState(processMessagesState);
    
    /**
     * 指定の処理中メッセージを画面に表示する
     * @return id。メッセージを消す際にhideProcessに渡す。
     */
    const showProcessMessage = useCallback((param: ProcessMessageType): number => {
        // キー発行
        const id = currentProcessCnt + 1;

        const withID = Object.assign({}, param, {
            id,
        });

        setProcessMessages((current) => {
            return current.concat(withID);
        });
        setProcessCnt(id);
        return id;
    }, [setProcessMessages, currentProcessCnt, setProcessCnt]);

    /**
     * 表示中のメッセージを消す
     * @param id showProcessMessageで返されたid
     */
    const hideProcessMessage = useCallback((id: number) => {
        setProcessMessages((current) => {
            return current.filter(item => item.id !== id);
        });
    }, [setProcessMessages]);

    return {
        showProcessMessage,
        hideProcessMessage,
    }
}