import { atom, selector } from 'recoil';
import { ConnectAPI, ErrorType, GetMapInfoAPI } from 'tsunagumap-api';
import { getAPICallerInstance } from '../api/ApiCaller';
import { createMqttClientInstance } from './session/MqttInstanceManager';
import { ApiAccessError, ServerInfo } from '../types/types';
import { MapDefine, MapKind } from '279map-common';
import { ApiException } from '../api';
import { mapKindState } from './operation/operationAtom';
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

type ConnectStatus = {
    status: 'connecting-map',
} | {
    status: 'connected',
    connectedMap: MapDefine,
    sid: string,
} | {
    status: 'failure',
    error: ApiAccessError,
}
export const connectStatusState = selector<ConnectStatus>({
    key: 'connectionState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
            const mapId = get(mapIdState);
            const mapServer = get(mapServerState);
            if (instanceId.length === 0 || mapId.length === 0 || !mapServer) {
                // まだ初期化されていない状態なら何もしない
                return {
                    status: 'connecting-map',
                }
            }
            const apiCaller = getAPICallerInstance(instanceId);

            const json = await apiCaller.connect(mapId);
            createMqttClientInstance(instanceId, mapServer.host, json.sid);

            return {
                status: 'connected',
                connectedMap: json.mapDefine,
                sid: json.sid,
            }

        } catch(e) {
            console.warn('connect error', e);

            if (e instanceof ApiException) {
                return {
                    status: 'failure',
                    error: e.apiError,
                }
            } else {
                return {
                    status: 'failure',
                    error: {
                        type: ErrorType.IllegalError,
                        detail: e + '',
                    }
                }
            }
        }
    }
})

export const mapDefineState = selector({
    key: 'mapDefineState',
    get: async({ get }) => {
        const connectStatus = get(connectStatusState);
        if (connectStatus.status !== 'connected') {
            return undefined;
        }
        
        const instanceId = get(instanceIdState);
        const apiCaller = getAPICallerInstance(instanceId);

        const mapKind = get(mapKindState);

        const apiResult = await apiCaller.callApi(GetMapInfoAPI, {
            mapKind: mapKind ?? connectStatus.connectedMap.defaultMapKind,
        });
        return apiResult;
    }
})

/**
 * 地図に接続済みかどうか
 */
export const isConnectedMapState = selector({
    key: 'isConnectingMapState',
    get: ({ get }) => {
        const mapDefine = get(mapDefineState);
        return mapDefine !== undefined;
    }
})

export const currentMapKindState = selector<MapKind|undefined>({
    key: 'currentMapKindSelector',
    get: ( { get } ) => {
        const mapDefine = get(mapDefineState);
        return mapDefine?.mapKind;
    }
})

export const defaultExtentState = selector<Extent>({
    key: 'defaultExtentSelector',
    get: ( { get } ) => {
        const mapDefine = get(mapDefineState);
        return mapDefine?.extent ?? [0,0,0,0];
    }
})
