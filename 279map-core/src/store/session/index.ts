import { Extent } from "ol/extent";
import { atom } from 'jotai';
import { atomWithReducer, loadable, selectAtom } from 'jotai/utils';
import { Loadable } from 'jotai/vanilla/utils/loadable';
import { atomWithCountup } from '../../util/jotaiUtility';
import { clientAtom } from 'jotai-urql';
import { SwitchMapKindDocument, SwitchMapKindMutation, MapKind, Auth } from '../../graphql/generated/graphql';

// TODO: MapConnnector内で管理するように変更する
export const instanceIdAtom = atomWithCountup('instance-');

export const mapDefineAtom = atom({
    connected: false,
    defaultMapKind: MapKind.Real,
    name: '',
    options: {} as any,
    useMaps: [] as MapKind[],
    authLv: Auth.None,
});

export const authLvAtom = atom<Auth>((get) => {
    const mapDefine = get(mapDefineAtom);
    return mapDefine.authLv;
});

// ユーザに表示指定された地図種別
export const specifiedMapKindAtom = atom<MapKind|undefined>(undefined);

export const mapDefineReducerAtom = atomWithReducer(0, (prev) => prev+1);
type SwitchMapKindResult = SwitchMapKindMutation['switchMapKind']
type MapDefineType = SwitchMapKindResult & {
    mapKind: MapKind
}
const currentMapKindInfoAtom = atom<Promise<MapDefineType>>(async(get) => {
    get(mapDefineReducerAtom);
    const mapDefine = get(mapDefineAtom);
    if (!mapDefine.connected) {
        throw Promise;
    }

    const specifiedMapKind = get(specifiedMapKindAtom);
    const mapKind = specifiedMapKind ?? mapDefine.defaultMapKind;
    
    const gqlClient = get(clientAtom);
    const res = await gqlClient.mutation(SwitchMapKindDocument, {
        mapKind,
    });
    if (!res.data) {
        throw res.error;
    }
    const data = res.data.switchMapKind;
    return {
        mapKind,
        ...data
    };
});
const mapDefineLoadableAtom = loadable(currentMapKindInfoAtom);

/**
 * 地図定義情報。
 * 地図種別切り替え時、新データ取得までは切替前の情報を保持する
 */
export const currentMapDefineAtom = selectAtom<Loadable<Promise<MapDefineType>>, MapDefineType|undefined>(mapDefineLoadableAtom, (current, prev) => {
    if (current?.state === 'hasData') {
        return current.data;
    } else {
        return prev;
    }
})

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
    const mapDefineLoadable = get(mapDefineLoadableAtom);
    if (mapDefineLoadable.state === 'hasData') {
        return mapDefineLoadable.data.extent;
    } else {
        return [0,0,0,0];
    }
})
