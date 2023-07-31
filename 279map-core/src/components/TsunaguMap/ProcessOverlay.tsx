import React from 'react';
import { useRecoilValue } from 'recoil';
import { isShowOverlayState, isShowSpinnerState, processMessageState } from '../common/spinner/useProcessMessage';
import Overlay from '../common/spinner/Overlay';

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
export default function ProcessOverlay() {
    const isShowOverlay = useRecoilValue(isShowOverlayState);
    const isShowSpinner = useRecoilValue(isShowSpinnerState);
    const processMessage = useRecoilValue(processMessageState);

    return (
        <Overlay
            spinner={isShowSpinner}
            minimum={!isShowOverlay}
            message={processMessage?.message}
        />
    )
}
