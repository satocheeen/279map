import { ConnectResult, ErrorType, GetMapInfoAPI, GetMapInfoResult } from 'tsunagumap-api';
import { Auth, MapKind } from '279map-common';
import { ApiException, MyErrorType } from '../../api';
import { Extent } from "ol/extent";
import { atom } from 'jotai';
import { atomWithReducer, loadable, selectAtom } from 'jotai/utils';
import { getAPICallerInstance, hasAPICallerInstance } from '../../api/useApi';
import { Loadable } from 'jotai/vanilla/utils/loadable';

export const instanceIdAtom = atom('');

export const mapIdAtom = atom<string>('');

export const connectReducerAtom = atomWithReducer(0, (prev) => prev+1);
export const connectStatusAtom = atom<Promise<ConnectResult>>(async( get ) => {
    try {
        get(connectReducerAtom);

        const mapId = get(mapIdAtom);
        console.log('connect to', mapId);

        const apiId = get(instanceIdAtom);
        if (!hasAPICallerInstance(apiId)) {
            throw new ApiException({
                type: MyErrorType.NonInitialize,
            })
        }
        const apiCaller = getAPICallerInstance(apiId);
        const json = await apiCaller.connect(mapId);

        return json;

    } catch(e) {
        throw new ApiException({
            type: ErrorType.IllegalError,
            detail: e + '',
        })
    }
})

export const connectStatusLoadableAtom = loadable(connectStatusAtom);

// ユーザに表示指定された地図種別
export const specifiedMapKindAtom = atom<MapKind|undefined>(undefined);
const mapDefineAtom = atom<Promise<GetMapInfoResult>>(async(get) => {
    const connectStatus = await get(connectStatusAtom);
    const specifiedMapKind = get(specifiedMapKindAtom);
    const mapKind = specifiedMapKind ?? connectStatus.mapDefine.defaultMapKind;
    const apiId = get(instanceIdAtom);
    const apiCaller = getAPICallerInstance(apiId);
    const res = await apiCaller.callApi(GetMapInfoAPI, {
        mapKind,
    });
    return res;
});
export const mapDefineLoadableAtom = loadable(mapDefineAtom);

/**
 * 地図定義情報。
 * 地図種別切り替え時、新データ取得までは切替前の情報を保持する
 */
export const currentMapDefineAtom = selectAtom<Loadable<Promise<GetMapInfoResult>>, GetMapInfoResult|undefined>(mapDefineLoadableAtom, (current, prev) => {
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

export const authLvAtom = atom<Auth>(( get ) => {
    const connectStatus = get(connectStatusLoadableAtom);
    if (connectStatus.state !== 'hasData') return Auth.None;
    switch(connectStatus.data.mapDefine.authLv) {
        case Auth.None:
        case Auth.Request:
            return connectStatus.data.mapDefine.guestAuthLv;
        default:
            return connectStatus.data.mapDefine.authLv;
    }
})