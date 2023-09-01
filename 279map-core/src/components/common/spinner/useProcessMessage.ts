import { useCallback } from "react";
import { processMessageCounterAtom, processMessagesAtom } from "./atoms";
import { useAtom } from "jotai";
import { ProcessMessageType } from "./types";

export function useProcessMessage() {
    const [currentProcessCnt, setProcessCnt] = useAtom(processMessageCounterAtom);
    const [processMessages, setProcessMessages] = useAtom(processMessagesAtom);
    
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