import { useContext, useMemo } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { TsunaguMapProps } from '../types/types';
import useMyMedia from './useMyMedia';
import { connectStatusLoadableAtom } from '../store/session';
import { useAtom } from 'jotai';

/**
 * 呼び出し元から渡されたpropsと、地図固有のオプション値を加味して、
 * この地図でのオプション設定値を算出して返すフック
 */
export function useMapOptions() {
    const ownerContext = useContext(OwnerContext);
    const { isPC } = useMyMedia();
    const [ connectStatusLoadable ] = useAtom(connectStatusLoadableAtom);

    const options = useMemo(() => {
        if (connectStatusLoadable.state !== 'hasData') return;
        return connectStatusLoadable.data.mapDefine.options;
    }, [connectStatusLoadable]);

    const popupMode = useMemo((): TsunaguMapProps['popupMode'] => {
        // 優先順位：呼び出し元から指定された値→地図に対するオプション指定→デフォルト値
        let mode = ownerContext.popupMode ?? options?.popupMode;

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

    const disabledLabel = useMemo((): boolean => {
        if (options?.itemLabel) {
            return options.itemLabel === 'hidden';
        }
        return ownerContext.disabledLabel ?? false;

    }, [ownerContext.disabledLabel, options]);

    return {
        popupMode,
        disabledLabel,
    }
}