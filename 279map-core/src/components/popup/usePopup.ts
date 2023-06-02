import { useContext, useMemo } from 'react';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { TsunaguMapProps } from '../../entry';
import useMyMedia from '../../util/useMyMedia';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';

/**
 * ポップアップ関連の共通処理
 * @returns 
 */
export function usePopup() {
    const ownerContext = useContext(OwnerContext);
    const { isPC } = useMyMedia();
    const options = useSelector((state: RootState) => {
        if (state.session.connectStatus.status === 'connected') {
            return state.session.connectStatus.connectedMap.options;
        }
        return undefined;
    })

    const popupMode = useMemo((): TsunaguMapProps['popupMode'] => {
        // 優先順位：地図に対するオプション指定→呼び出し元から指定された値
        let mode = options?.popupMode ?? ownerContext.popupMode;

        // 未指定の場合はデフォルト値
        if (!mode) {
            mode = 'minimum';
        }

        // SPの場合、最大化表示指定されていてもminimumに
        if (mode === 'maximum' && !isPC) {
            mode = 'minimum';
        }

        return mode;
    }, [ownerContext.popupMode, options, isPC]);

    return {
        popupMode,
    }
}