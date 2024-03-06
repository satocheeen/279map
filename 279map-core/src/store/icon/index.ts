import { MapKind } from '../../graphql/generated/graphql';
import { SystemIconDefine, TsunaguMapProps } from '../../types/types';
import { currentMapDefineAtom, currentMapKindAtom } from '../session';
// import defaultIcon from './pin.png'
import defaultIcon from './map-marker.svg'
import { atom } from 'jotai';

/**
 * オリジナルアイコン
 */
const originalIconDefineAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    const originalIcons = mapDefine?.originalIcons ?? [];

    const originalDefines = originalIcons.map(def => {
        return {
            type: 'original',
            id: def.id,
            caption: def.caption,
            imagePath: def.imagePath,
            useMaps: def.useMaps,
        } as SystemIconDefine;
    })
    return originalDefines;
})

export const defaultIconDefineAtom = atom<Required<TsunaguMapProps>['iconDefine']>([]);

const iconDefineAtom = atom<SystemIconDefine[]>((get) => {
    const defaultIconDefine = get(defaultIconDefineAtom);
    const originalIconDefine = get(originalIconDefineAtom);
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
        defaultColor: '#271AA8',
        type: 'system',
    }
}
