import { SystemIconDefine, TsunaguMapProps } from '../../types/types';
import { currentMapKindAtom, instanceIdAtom } from '../session';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { GetOriginalIconDefineAPI } from 'tsunagumap-api';
import { MapKind } from '279map-common';
import defaultIcon from './pin.png'
import { atom } from 'jotai';

const originalIconDefineAtom = atom<Promise<SystemIconDefine[]>>(async(get) => {
    try {
        const instanceId = get(instanceIdAtom);
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

export const defaultIconDefineAtom = atom<Required<TsunaguMapProps>['iconDefine']>([]);

const iconDefineAtom = atom<Promise<SystemIconDefine[]>>(async(get) => {
    const defaultIconDefine = get(defaultIconDefineAtom);
    const originalIconDefine = await get(originalIconDefineAtom);
    const list = defaultIconDefine.map(def => {
        if (def.id === 'default') {
            return getDefaultIconDefine(def.useMaps);
        }
        return Object.assign({
            type: 'system',
        } as SystemIconDefine, def);
    });
    Array.prototype.push.apply(list, originalIconDefine);
    return list;        
})

/**
 * アイコン未指定の場合に設定するアイコン
 */
export const currentDefaultIconAtom = atom<Promise<SystemIconDefine>>(async(get) => {
    // とりあえず冒頭のアイコン
    const currentMapIconDefine = await get(currentMapIconDefineAtom);
    return currentMapIconDefine[0];
})

/**
 * 現在の地図で使用可能なアイコン定義情報
 */
export const currentMapIconDefineAtom = atom<Promise<SystemIconDefine[]>>(async(get) => {
    const currentMapKind = get(currentMapKindAtom); 
    if (!currentMapKind) return [];
    
    const iconDefine = await get(iconDefineAtom);
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
