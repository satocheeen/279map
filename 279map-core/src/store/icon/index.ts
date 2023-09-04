import { SystemIconDefine, TsunaguMapProps } from '../../types/types';
import { currentMapKindAtom } from '../session';
import { GetOriginalIconDefineAPI } from 'tsunagumap-api';
import { MapKind } from '279map-common';
import defaultIcon from './pin.png'
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { apiIdAtom, getAPICallerInstance } from '../../api/useApi';

const originalIconDefineAtom = atom<Promise<SystemIconDefine[]>>(async(get) => {
    try {
        const instanceId = get(apiIdAtom);
        const apiCaller = getAPICallerInstance(instanceId)
        const apiResult = await apiCaller.callApi(GetOriginalIconDefineAPI, undefined);
        const originalDefines = apiResult.map(def => {
            return {
                type: 'original',
                id: def.id,
                caption: def.caption,
                imagePath: def.imagePath,
                useMaps: def.useMaps,
            } as SystemIconDefine;
        })
        return originalDefines;

    } catch (e) {
        console.warn('loadOriginalIcon error', e);
        return [];
    }
});
const originalIconDefineLoadableAtom = loadable(originalIconDefineAtom);

export const defaultIconDefineAtom = atom<Required<TsunaguMapProps>['iconDefine']>([]);

const iconDefineAtom = atom<SystemIconDefine[]>((get) => {
    const defaultIconDefine = get(defaultIconDefineAtom);
    const originalIconDefineLoadable = get(originalIconDefineLoadableAtom);
    const list = defaultIconDefine.map(def => {
        if (def.id === 'default') {
            return getDefaultIconDefine(def.useMaps);
        }
        return Object.assign({
            type: 'system',
        } as SystemIconDefine, def);
    });
    if (originalIconDefineLoadable.state === 'hasData') {
        Array.prototype.push.apply(list, originalIconDefineLoadable.data);
    }
    return list;        
})

/**
 * アイコン未指定の場合に設定するアイコン
 */
export const currentDefaultIconAtom = atom<SystemIconDefine>((get) => {
    // とりあえず冒頭のアイコン
    const currentMapIconDefine = get(currentMapIconDefineAtom);
    return currentMapIconDefine[0];
})

/**
 * 現在の地図で使用可能なアイコン定義情報
 */
export const currentMapIconDefineAtom = atom<SystemIconDefine[]>((get) => {
    const currentMapKind = get(currentMapKindAtom); 
    if (!currentMapKind) return [];
    
    const iconDefine = get(iconDefineAtom);
    const list = iconDefine.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
    if (list.length > 0) {
        return list;
    }
    const defaultIconDefine = getDefaultIconDefine([currentMapKind]);
    return [defaultIconDefine];
})

function getDefaultIconDefine(useMaps: MapKind[]): SystemIconDefine {
    return {
        id: 'default',
        imagePath: defaultIcon,
        useMaps,
        // menuViewCustomCss: {
        //     filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
        // },
        // defaultColor: '#77f',
        type: 'system',
    }
}
