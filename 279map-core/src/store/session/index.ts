import { atom } from 'jotai';
import { atomWithCountup } from '../../util/jotaiUtility';
import { Auth, MapPageOptions, SwitchMapKindMutation } from '../../graphql/generated/graphql';
import { Extent } from "ol/extent";
import { IconDefine, MapKind } from '../../types-common/common-types';

/**
 * 地図への接続情報関連Atom
 */

// TODO: MapConnnector内で管理するように変更する
export const instanceIdAtom = atomWithCountup('instance-');

export const mapDefineAtom = atom({
    connected: false,
    defaultMapKind: MapKind.Real,
    name: '',
    options: {} as MapPageOptions,
    useMaps: [] as MapKind[],
    authLv: Auth.None,
    originalIcons: [] as IconDefine[],
});

/**
 * 世界地図を使用するかどうか
 */
export const isWorldMapAtom = atom((get) => {
    const mapDefine = get(mapDefineAtom);
    return mapDefine.options.options?.includes('WorldMap');
})
export const authLvAtom = atom<Auth>((get) => {
    const mapDefine = get(mapDefineAtom);
    return mapDefine.authLv;
});

type SwitchMapKindResult = SwitchMapKindMutation['switchMapKind']
type MapDefineType = SwitchMapKindResult & {
    mapKind: MapKind
}
/**
 * 地図定義情報。
 * 地図種別切り替え時、新データ取得までは切替前の情報を保持する
 */
export const currentMapDefineAtom = atom<MapDefineType|undefined>(undefined);

// 現在表示中の地図種別。地図情報ロード完了後は、specifiedMapKindと等しい値になる。
export const currentMapKindAtom = atom<MapKind|undefined>((get) => {
    const mapDefine = get(currentMapDefineAtom);
    return mapDefine?.mapKind;
})

/**
 * 初期エクステント
 * （将来的には、ユーザが最後に参照していたエクステントを記録して、それを反映するようにしたい）
 */
export const defaultExtentAtom = atom<Extent>((get) => {
    const currentMapKindInfo = get(currentMapDefineAtom);
    return currentMapKindInfo?.extent ?? [0,0,0,0];
})
