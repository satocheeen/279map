import React from 'react';
import Overlay from '../common/spinner/Overlay';
import { useAtom } from 'jotai';
import { isShowOverlayAtom, isShowSpinnerAtom, processMessageAtom } from '../common/spinner/atoms';

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
export default function ProcessOverlay() {
    const [isShowOverlay] = useAtom(isShowOverlayAtom);
    const [isShowSpinner] = useAtom(isShowSpinnerAtom);
    const [processMessage] = useAtom(processMessageAtom);

    return (
        <Overlay
            spinner={isShowSpinner}
            minimum={!isShowOverlay}
            message={processMessage?.message}
        />
    )
}
