import { MapKind, TsunaguMapProps } from "../entry";

/**
 * frontendと同様のアイコン群。
 * アイコンバリエーションが多い場合のテスト用
 */
export const iconDefine: Required<TsunaguMapProps['iconDefine']> = {
    defines: [
        {
            id: 'pin',
            caption: 'pin',
            imagePath: './icon2/pin.svg',
            useMaps: [MapKind.Real],
            defaultColor: '#271AA8',
        },
        {
            id: 'flag',
            caption: 'flag',
            imagePath: './icon2/flag.svg',
            useMaps: [MapKind.Real],
            defaultColor: '#ffd800',
        },
        {
            id: 'school',
            imagePath: '/icon2/school.png',
            useMaps: [MapKind.Virtual],
            caption: 'school',
        },
        {
            id: 'cafe',
            imagePath: '/icon2/cafe.png',
            useMaps: [MapKind.Virtual],
            caption: 'cafe',
        },
        {
            id: 'house1',
            caption: 'house1',
            imagePath: '/icon2/house1.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'house2',
            caption: 'house2',
            imagePath: '/icon2/house2.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'house3',
            caption: 'house3',
            imagePath: '/icon2/house3.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'building1',
            caption: 'building1',
            imagePath: '/icon2/building1.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'building2',
            caption: 'building2',
            imagePath: '/icon2/building2.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'building3',
            caption: 'building3',
            imagePath: '/icon2/building3.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'building4',
            caption: 'building4',
            imagePath: '/icon2/building4.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'hall',
            caption: 'hall',
            imagePath: '/icon2/hall.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'hospital',
            caption: 'hospital',
            imagePath: '/icon2/hospital.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'kojo',
            caption: 'kojo',
            imagePath: '/icon2/kojo.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'shop',
            caption: 'shop',
            imagePath: '/icon2/shop.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'restaurant',
            caption: 'restaurant',
            imagePath: '/icon2/restaurant.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'shrine',
            caption: 'shrine',
            imagePath: '/icon2/shrine.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'park',
            caption: 'park',
            imagePath: '/icon2/park.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'tower',
            caption: 'tower',
            imagePath: '/icon2/tower.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'tree1',
            caption: 'tree1',
            imagePath: '/icon2/tree1.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'tree2',
            caption: 'tree2',
            imagePath: '/icon2/tree2.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'shark',
            caption: 'shark',
            imagePath: '/icon2/shark.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'ship',
            caption: 'ship',
            imagePath: '/icon2/ship.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'present-red',
            caption: 'present-red',
            imagePath: '/icon2/present-red.png',
            useMaps: [MapKind.Virtual],
        },
    ],
    defaultIconId: {
        real: 'pin',
        virtual: 'house1'
    }
};