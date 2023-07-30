import { atom, selector } from 'recoil';
import { SystemIconDefine, TsunaguMapProps } from '../../types/types';
import { currentMapKindState, instanceIdState } from '../map';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { GetOriginalIconDefineAPI } from 'tsunagumap-api';
import { MapKind } from '../../entry';
import defaultIcon from './pin.png'

const originalIconDefineState = selector<SystemIconDefine[]>({
    key: 'originalIconDefineState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
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
    }
})

export const defaultIconDefineState = atom<Required<TsunaguMapProps>['iconDefine']>({
    key: 'defaultIconDefineState',
    default: [],
});

const iconDefineState = selector<SystemIconDefine[]>({
    key: 'iconDefineState',
    get: ({ get }) => {
        const defaultIconDefine = get(defaultIconDefineState);
        const originalIconDefine = get(originalIconDefineState);
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
    }
})

/**
 * アイコン未指定の場合に設定するアイコン
 */
export const currentDefaultIconState = selector<SystemIconDefine>({
    key: 'currentDefaultIconState',
    get: ({ get }) => {
        // とりあえず冒頭のアイコン
        const currentMapIconDefine = get(currentMapIconDefineState);
        return currentMapIconDefine[0];
    }
})

/**
 * 現在の地図で使用可能なアイコン定義情報
 */
export const currentMapIconDefineState = selector<SystemIconDefine[]>({
    key: 'currentMapIconDefineState',
    get: ({ get }) => {
        const currentMapKind = get(currentMapKindState); 
        if (!currentMapKind) return [];
        
        const iconDefine = get(iconDefineState);
        const list = iconDefine.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
        if (list.length > 0) {
            return list;
        }
        const defaultIconDefine = getDefaultIconDefine([currentMapKind]);
        return [defaultIconDefine];
    }
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
