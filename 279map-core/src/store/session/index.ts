import { ConnectResult, GetMapInfoResult } from 'tsunagumap-api';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { ServerInfo } from '../../types/types';
import { Auth, MapKind } from '279map-common';
import { ApiException, MyErrorType } from '../../api';
import { Extent } from "ol/extent";
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';

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
        const apiCaller = getAPICallerInstance(instanceId);

        const json = await apiCaller.connect(mapId);

        return json;

    } catch(e) {
        console.warn('connect error', e);
        throw e;
    }
})

export const connectStatusLoadableAtom = loadable(connectStatusAtom);

export const mapDefineAtom = atom<GetMapInfoResult|undefined>(undefined);

export const currentMapKindAtom = atom<MapKind|undefined>((get) => {
    const mapDefine = get(mapDefineAtom);
    return mapDefine?.mapKind;
})

/**
 * 初期エクステント
 * （将来的には、ユーザが最後に参照していたエクステントを記録して、それを反映するようにしたい）
 */
export const defaultExtentAtom = atom<Extent>((get) => {
    const mapDefine = get(mapDefineAtom);
    return mapDefine?.extent ?? [0,0,0,0];
})

export const authLvAtom = atom<Promise<Auth>>(async( get ) => {
    const connectStatus = await get(connectStatusAtom);
    switch(connectStatus.mapDefine.authLv) {
        case Auth.None:
        case Auth.Request:
            return connectStatus.mapDefine.guestAuthLv;
        default:
            return connectStatus.mapDefine.authLv;
    }
})