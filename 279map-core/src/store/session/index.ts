import { ConnectResult, GetMapInfoAPI, GetMapInfoResult } from 'tsunagumap-api';
import { ServerInfo } from '../../types/types';
import { Auth, MapKind } from '279map-common';
import { ApiException, MyErrorType } from '../../api';
import { Extent } from "ol/extent";
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { apiIdAtom, getAPICallerInstance } from '../../api/useApi';

export const instanceIdAtom = atom('');

export const mapIdAtom = atom<string|undefined>(undefined);

export const mapServerAtom = atom<ServerInfo|undefined>(undefined);

export const refreshConnectStatusAtom = atom(0);
export const connectStatusAtom = atom<Promise<ConnectResult>>(async( get ) => {
    try {
        get(refreshConnectStatusAtom);
        const mapId = get(mapIdAtom);
        const instanceId = get(instanceIdAtom);
        const mapServer = get(mapServerAtom);
        if (instanceId.length === 0 || !mapId || !mapServer) {
            // まだ初期化されていない状態なら何もしない
            throw new ApiException({
                type: MyErrorType.NonInitialize,
            })
        }
        const apiId = get(apiIdAtom);
        const apiCaller = getAPICallerInstance(apiId);
        if (!apiCaller) {
            throw new ApiException({
                type: MyErrorType.NonInitialize,
            })
        }

        const json = await apiCaller.connect(mapId);

        return json;

    } catch(e) {
        console.warn('connect error', e);
        throw e;
    }
})

export const connectStatusLoadableAtom = loadable(connectStatusAtom);

// ユーザに表示指定された地図種別
export const specifiedMapKindAtom = atom<MapKind|undefined>(undefined);
export const mapDefineAtom = atom<Promise<GetMapInfoResult>>(async(get) => {
    const connectStatus = await get(connectStatusAtom);
    const specifiedMapKind = get(specifiedMapKindAtom);
    const mapKind = specifiedMapKind ?? connectStatus.mapDefine.defaultMapKind;
    const apiId = get(apiIdAtom);
    const apiCaller = getAPICallerInstance(apiId);
    if (!apiCaller) {
        throw new ApiException({
            type: MyErrorType.NonInitialize,
        })
    }
    const res = await apiCaller.callApi(GetMapInfoAPI, {
        mapKind,
    });
    return res;
});
export const mapDefineLoadableAtom = loadable(mapDefineAtom);

// 現在表示中の地図種別。地図情報ロード完了後は、specifiedMapKindと等しい値になる。
export const currentMapKindAtom = atom<MapKind|undefined>((get) => {
    const mapDefineLoadable = get(mapDefineLoadableAtom);
    if (mapDefineLoadable.state === 'hasData') {
        return mapDefineLoadable.data.mapKind;
    } else {
        return;
    }
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