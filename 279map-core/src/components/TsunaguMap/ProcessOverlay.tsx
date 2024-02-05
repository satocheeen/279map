import React, { useMemo } from 'react';
import Overlay from '../common/spinner/Overlay';
import { useAtom } from 'jotai';
import { processMessagesAtom } from '../common/spinner/useProcessMessage';

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
export default function ProcessOverlay() {
    const [ processMessages ] = useAtom(processMessagesAtom);

    /**
     * オーバーレイ表示するかどうか
     */
    const isShowOverlay = useMemo(() => {
        return processMessages.some(pm => pm.overlay);
    }, [processMessages]);

    /**
     * スピナー表示するかどうか
     */
    const isShowSpinner = useMemo(() => {
        return processMessages.some(pm => pm.spinner);
    }, [processMessages]);

    /**
     * 表示するメッセージ。メッセージが存在しない場合は、undefined。
     */
    const processMessage = useMemo(() => {
        return processMessages.find(pm => pm.message);
    }, [processMessages]);
    
    return (
        <Overlay
            spinner={isShowSpinner}
            minimum={!isShowOverlay}
            message={processMessage?.message}
        />
    )
}
