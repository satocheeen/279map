import { useContext, useMemo } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { TsunaguMapProps } from '../types/types';
import useMyMedia from './useMyMedia';
import { currentMapKindAtom, mapDefineAtom } from '../store/session';
import { useAtom } from 'jotai';
import { ItemLabelMode, MapKind } from '../graphql/generated/graphql';

/**
 * 呼び出し元から渡されたpropsと、地図固有のオプション値を加味して、
 * この地図でのオプション設定値を算出して返すフック
 */
export function useMapOptions() {
    const ownerContext = useContext(OwnerContext);
    const { isPC } = useMyMedia();
    const [ mapDefine ] = useAtom(mapDefineAtom);
    const [ mapKind ] = useAtom(currentMapKindAtom);

    const options = useMemo(() => {
        return mapDefine.options;
    }, [mapDefine]);

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
        switch(options.itemLabel) {
            case ItemLabelMode.Hidden:
                return true;
            case ItemLabelMode.VirtualShow:
                return mapKind !== MapKind.Virtual;
            case ItemLabelMode.RealShow:
                return mapKind !== MapKind.Real;
            case ItemLabelMode.Show:
                return false;
        }
        return ownerContext.disabledLabel ?? false;

    }, [ownerContext.disabledLabel, options, mapKind]);

    return {
        popupMode,
        disabledLabel,
    }
}