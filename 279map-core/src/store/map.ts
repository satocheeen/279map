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

export const mapServerState = atom<ServerInfo>({
    key: 'mapServerState',
    default: {
        host: '',
        ssl: false,
    }
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
            const apiCaller = getAPICallerInstance(instanceId);
            const mapId = get(mapIdState);
            const mapServer = get(mapServerState);

            if (mapId.length === 0) {
                return {
                    status: 'connecting-map',
                }
            }

            const json = await apiCaller.callApi(ConnectAPI, {
                mapId,
            });

            apiCaller.setSID(json.sid);
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
