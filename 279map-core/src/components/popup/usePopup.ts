import { useContext, useMemo } from 'react';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { TsunaguMapProps } from '../../entry';

/**
 * ポップアップ関連の共通処理
 * @returns 
 */
export function usePopup() {
    const ownerContext = useContext(OwnerContext);

    const popupMode = useMemo((): TsunaguMapProps['popupMode'] => {
        if (!ownerContext.popupMode) {
            return 'maximum';
        }
        // TODO: 地図に対してオプション指定されている場合は、そちらを採用する
        return ownerContext.popupMode;
    }, [ownerContext.popupMode]);

    return {
        popupMode,
    }
}