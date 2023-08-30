import { atom as atomAsRecoil, selector } from 'recoil';
import { ConnectResult, ErrorType, GetMapInfoResult } from 'tsunagumap-api';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { ServerInfo } from '../../types/types';
import { Auth, MapKind } from '279map-common';
import { ApiException } from '../../api';
import { Extent } from "ol/extent";
import { atom } from 'jotai';

export const instanceIdState = atomAsRecoil<string>({
    key: 'instanceIdState',
    default: '',
})
export const instanceIdAtom = atom('');

export const mapIdState = atomAsRecoil<string>({
    key: 'mapIdState',
    default: '',
});

export const mapServerState = atomAsRecoil<ServerInfo|undefined>({
    key: 'mapServerState',
    default: undefined,
});

export const connectStatusState = selector<ConnectResult>({
    key: 'connectionState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
            const mapId = get(mapIdState);
            const mapServer = get(mapServerState);
            if (instanceId.length === 0 || mapId.length === 0 || !mapServer) {
                // まだ初期化されていない状態なら何もしない
                throw new ApiException({
                    type: ErrorType.UndefinedMap,
                })
            }
            const apiCaller = getAPICallerInstance(instanceId);

            const json = await apiCaller.connect(mapId);

            return json;

        } catch(e) {
            console.warn('connect error', e);
            throw e;
        }
    }
})

export const mapDefineState = atomAsRecoil<GetMapInfoResult>({
    key: 'mapDefineState',
    default: {
        mapKind: MapKind.Real,
        extent: [0,0,0,0],
        dataSourceGroups: [],
    }
});
export const mapDefineAtom = atom<GetMapInfoResult>({
    mapKind: MapKind.Real,
    extent: [0,0,0,0],
    dataSourceGroups: [],
})

export const currentMapKindState = selector<MapKind|undefined>({
    key: 'currentMapKindSelector',
    get: ( { get } ) => {
        const mapDefine = get(mapDefineState);
        return mapDefine?.mapKind;
    }
})

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

export const authLvState = selector<Auth>({
    key: 'authSelector',
    get: ( { get } ) => {
        const connectStatus = get(connectStatusState);
        switch(connectStatus.mapDefine.authLv) {
            case Auth.None:
            case Auth.Request:
                return connectStatus.mapDefine.guestAuthLv;
            default:
                return connectStatus.mapDefine.authLv;
        }
    }
})