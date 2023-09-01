import { atom } from "jotai";
import { ProcessMessageWithID } from "./types";

export const processMessageCounterAtom = atom<number>(0);

export const processMessagesAtom = atom<ProcessMessageWithID[]>([]);

/**
 * オーバーレイ表示するかどうか
 */
export const isShowOverlayAtom = atom<boolean>(( get ) => {
    const processMessages = get(processMessagesAtom);
    return processMessages.some(pm => pm.overlay);
})

/**
 * スピナー表示するかどうか
 */
export const isShowSpinnerAtom = atom<boolean>(( get ) => {
    const processMessages = get(processMessagesAtom);
    return processMessages.some(pm => pm.spinner);
})

/**
 * 表示するメッセージ。メッセージが存在しない場合は、undefined。
 */
export const processMessageAtom = atom<ProcessMessageWithID|undefined>(( get ) => {
    const processMessages = get(processMessagesAtom);
    return processMessages.find(pm => pm.message);
})
