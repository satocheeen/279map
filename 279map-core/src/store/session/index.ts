import { atom, selector } from 'recoil';
import { ConnectResult, ErrorType, GetMapInfoResult } from 'tsunagumap-api';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { createMqttClientInstance } from './MqttInstanceManager';
import { ServerInfo } from '../../types/types';
import { MapKind } from '279map-common';
import { ApiException } from '../../api';
import { Extent } from "ol/extent";

export const instanceIdState = atom<string>({
    key: 'instanceIdState',
    default: '',
})

export const mapIdState = atom<string>({
    key: 'mapIdState',
    default: '',
});

export const mapServerState = atom<ServerInfo|undefined>({
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

export const mapDefineState = atom<GetMapInfoResult>({
    key: 'mapDefineState',
    default: {
        mapKind: MapKind.Real,
        extent: [0,0,0,0],
        dataSourceGroups: [],
    }
});

export const currentMapKindState = selector<MapKind|undefined>({
    key: 'currentMapKindSelector',
    get: ( { get } ) => {
        const mapDefine = get(mapDefineState);
        return mapDefine?.mapKind;
    }
})

/**
 * 初期エクステント
 * （将来的には、ユーザが最後に参照していたエクステントを記録して、それを反映するようにしたい）
 */
export const defaultExtentState = selector<Extent>({
    key: 'defaultExtentSelector',
    get: ( { get } ) => {
        const mapDefine = get(mapDefineState);
        return mapDefine?.extent ?? [0,0,0,0];
    }
})
