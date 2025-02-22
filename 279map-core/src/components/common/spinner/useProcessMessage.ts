import { useCallback } from "react";
import { atom, useAtom } from "jotai";
import { ProcessMessageType, ProcessMessageWithID } from "./types";

export const processMessagesAtom = atom<ProcessMessageWithID[]>([]);

let processCnt = 0
export function useProcessMessage() {
    const [processMessages, setProcessMessages] = useAtom(processMessagesAtom);
    
    /**
     * 指定の処理中メッセージを画面に表示する
     * @return id。メッセージを消す際にhideProcessに渡す。
     */
    const showProcessMessage = useCallback((param: ProcessMessageType): number => {
        // キー発行
        const id = ++processCnt;

        const withID = Object.assign({}, param, {
            id,
        });

        setProcessMessages((current) => {
            return current.concat(withID);
        });
        return id;
    }, [setProcessMessages]);

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