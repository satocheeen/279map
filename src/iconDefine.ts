import { CSSProperties } from "react";
import { IconDefine, MapKind } from "279map-common/dist/types";

/**
 * 建物アイコン定義
 */
export type SystemIconDefine = DefaultIconDefine & {
    type: 'system' | 'original',
}
type DefaultIconDefine = IconDefine & {
    // 建物選択メニューで表示する際にCSS変更する場合に指定（色の微調整など）
    menuViewCustomCss?: CSSProperties;
    defaultColor?: string;
}

const iconDefine = [
    {
        id: 'pin',
        imagePath: '/icon/pin.png',
        useMaps: [MapKind.Real],
        menuViewCustomCss: {
            filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
        },
        defaultColor: '#aaa',
    },
    {
        id: 'school',
        imagePath: '/icon/school.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'cafe',
        imagePath: '/icon/cafe.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'house1',
        imagePath: '/icon/house1.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'house2',
        imagePath: '/icon/house2.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'house3',
        imagePath: '/icon/house3.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'shop',
        imagePath: '/icon/shop.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'shrine',
        imagePath: '/icon/shrine.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'park',
        imagePath: '/icon/park.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'tree1',
        imagePath: '/icon/tree1.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'tree2',
        imagePath: '/icon/tree2.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'shark',
        imagePath: '/icon/shark.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'ship',
        imagePath: '/icon/ship.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
    {
        id: 'present-red',
        imagePath: '/icon/present-red.png',
        useMaps: [MapKind.Real, MapKind.Virtual],
    },
] as DefaultIconDefine[];
export const defaultIconDefine = iconDefine.map(def => {
    return Object.assign({
        type: 'system',
    } as SystemIconDefine, def);
});
