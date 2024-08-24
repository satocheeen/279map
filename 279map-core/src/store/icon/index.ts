import { SystemIconDefine, TsunaguMapProps } from '../../types/types';
import { currentMapKindAtom, mapDefineAtom } from '../session';
import defaultIconReal from './map-marker.svg';
import defaultIconVirtual from './house.png';
import { atom } from 'jotai';
import { MapKind } from '../../types-common/common-types';
import { loadable } from "jotai/utils";

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

export const systemIconDefineAtom = atom<Required<TsunaguMapProps>['iconDefine'] | undefined>(undefined);

/**
 * アイコン未指定の場合に設定するアイコン
 */
export const currentDefaultIconAtom = atom<SystemIconDefine>((get) => {
    const currentMapKind = get(currentMapKindAtom) ?? MapKind.Real; 
    const systemIconDefine = get(systemIconDefineAtom);
    const id = currentMapKind === MapKind.Real ? systemIconDefine?.defaultIconId.real : systemIconDefine?.defaultIconId.virtual;

    const currentMapIconDefine = get(currentMapIconDefineAtom);
    const icon = currentMapIconDefine.find(def => def.type === 'system' && def.id === id);
    if (!icon) {
        console.warn('想定外エラー. default icon not find.');
        if (currentMapKind === MapKind.Real) {
            return {
                type: 'system',
                id: 'default',
                caption: 'default',
                imagePath: defaultIconReal,
                useMaps: [MapKind.Real] as MapKind[],
                defaultColor: '#271AA8',
            }
        } else {
            return {
                type: 'system',
                id: 'default',
                caption: 'default',
                imagePath: defaultIconVirtual,
                useMaps: [MapKind.Virtual] as MapKind[],
            }
        }
    }
    return icon;
})

/**
 * 現在の地図で使用可能なアイコン一覧。
 * imagePathがSVG画像の場合は、SVG文字列を読み込んで、必要に応じて色設定する。
 */
export const currentMapIconDefinePromiseAtom = atom<Promise<SystemIconDefine[]>>(async(get) => {

    const currentMapKind = get(currentMapKindAtom); 
    if (!currentMapKind) return [];

    const systemIconDefine = get(systemIconDefineAtom) ?? {
        defines: [
            {
                type: 'system',
                id: 'default',
                caption: 'default',
                imagePath: defaultIconReal,
                useMaps: [MapKind.Real] as MapKind[],
                defaultColor: '#271AA8',
            },{
                type: 'system',
                id: 'default',
                caption: 'default',
                imagePath: defaultIconVirtual,
                useMaps: [MapKind.Virtual] as MapKind[],
            }
        ],
        defaultIconId: {
            real: 'default',
            virtual: 'default',
        }
    };
    const originalIconDefine = get(originalIconDefineAtom);

    const allIconDefines = systemIconDefine?.defines.map(def => {
        return Object.assign({
            type: 'system',
        } as SystemIconDefine, def);
    });
    Array.prototype.push.apply(allIconDefines, originalIconDefine);
    
    const list = allIconDefines.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);

    // SVG画像の場合は、データ展開する
    return Promise.all(list.map(async(def): Promise<SystemIconDefine> => {
        if ((def.imagePath as string).endsWith('.svg')) {
            const fetchSvgData = async () => {
                try {
                    const response = await fetch(def.imagePath);
                    const data = await response.text();
                    if (def.defaultColor) {
                        const modifiedData = addFillStyle(data, def.defaultColor, 'my-color');
                        return {
                            data,
                            modifiedData,
                        };
                    } else {
                        return { data };
                    }
                } catch (error) {
                    console.warn('SVGファイルの読み込みに失敗しました:', error);
                    return;
                }
            };
            const data = await fetchSvgData();
            if (!data) return def;
            def.originalSvgData = data.data;
            def.imagePath = 'data:image/svg+xml;utf8,' + (data.modifiedData ? data.modifiedData : data.data);
            return def;
        }
        return def;
    }));
})

const currentMapIconDefineLoadableAtom = loadable(currentMapIconDefinePromiseAtom);

/**
 * 現在の地図で使用可能なアイコン定義情報
 */
export const currentMapIconDefineAtom = atom<SystemIconDefine[]>((get) => {
    const data = get(currentMapIconDefineLoadableAtom);
    if (data.state !== 'hasData') return [];
    return data.data;
})

export const addFillStyle = (svgData: string, fillColor: string, targetClass: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const targetElements = doc.getElementsByClassName(targetClass);

    for (let i = 0; i < targetElements.length; i++) {
      targetElements[i].setAttribute('fill', hexToRgb(fillColor));
    }

    return new XMLSerializer().serializeToString(doc);
};

/**
 * hex値で書かれた色をrgb(r,g,b)の形式に変換する
 * @param hex 
 * @returns 
 */
function hexToRgb(hex: string) {
    hex = hex.replace('#', '');
  
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    return `rgb(${r}, ${g}, ${b})`;
}