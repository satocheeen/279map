import { TsunaguMapProps } from '../../types/types';
import { currentMapKindAtom, mapDefineAtom } from '../session';
// import defaultIcon from './pin.png'
import defaultIconReal from './map-marker.svg';
import defaultIconVirtual from './house.png';
import { atom } from 'jotai';
import { IconDefine, IconKey, MapKind } from '../../types-common/common-types';

/**
 * 現在の地図で使用可能なアイコン定義
 */
export type SystemIconDefine = Omit<IconDefine, 'useMaps'> & {
    type: IconKey['type'],

    isSystemIcon?: boolean; // システムデフォルトのアイコンの場合、true。（ピンの上に白丸を置く関係でひとまず設定）
}

/**
 * オリジナルアイコン
 */
const originalIconDefineAtom = atom((get) => {
    const mapDefine = get(mapDefineAtom);
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

/**
 * アイコン未指定の場合に設定するアイコン
 */
export const currentDefaultIconAtom = atom<SystemIconDefine>((get) => {
    const currentMapIconDefine = get(currentMapIconDefineAtom);
    const icon = currentMapIconDefine.find(def => def.id === 'default');
    if (!icon) {
        console.warn('想定外エラー. default icon not find.');
        return currentMapIconDefine[0];
    }
    return icon;
})

/**
 * 現在の地図で使用可能なアイコン定義情報
 */
export const currentMapIconDefineAtom = atom<SystemIconDefine[]>((get) => {
    const currentMapKind = get(currentMapKindAtom); 
    if (!currentMapKind) return [];

    const defaultIconDefine = get(defaultIconDefineAtom);
    const originalIconDefine = get(originalIconDefineAtom);

    const allIconDefines = defaultIconDefine.map(def => {
        return Object.assign({
            type: 'system',
        } as SystemIconDefine, def);
    });
    Array.prototype.push.apply(allIconDefines, originalIconDefine);
    
    const list = allIconDefines.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
    // defaultアイコンが外部から与えられていない場合は、設定する
    const hasDefulat = list.some(def => def.id === 'default');
    if (!hasDefulat) {
        const defaultIcon: SystemIconDefine = currentMapKind === MapKind.Real ? {
            id: 'default',
            caption: '',
            type: 'system',
            imagePath: defaultIconReal,
            defaultColor: '#271AA8',
            isSystemIcon: true,
        } : {
            id: 'default',
            type: 'system',
            imagePath: defaultIconVirtual,
            caption: '',
        }
        return [defaultIcon, ...list];
    }

    return list;
})
