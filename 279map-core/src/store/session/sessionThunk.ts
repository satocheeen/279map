import { createAsyncThunk } from "@reduxjs/toolkit";
import { doCommand } from "../../util/Commander";
import { RootState } from "../configureStore";
import { dataActions } from "../data/dataSlice";
import { ConnectAPI, ErrorType, GetMapInfoAPI, WebSocketMessage } from 'tsunagumap-api';
import { MapKind } from "279map-common";
import { ConnectAPIResult, LoadMapDefineResult } from "../../types/types";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { ApiException } from "../../api";
import { createMqttClientInstance } from "./MqttInstanceManager";

export const connectMap = createAsyncThunk<ConnectAPIResult, { instanceId: string; mapId: string; }>(
    'session/connectMapStatus',
    async(param, { getState, dispatch }) => {
        const mapServer = (getState() as RootState).session.mapServer;

        try {
            const apiCaller = getAPICallerInstance((getState() as RootState).session.instanceId);
            const json = await apiCaller.callApi(ConnectAPI, {
                mapId: param.mapId,
            });

            apiCaller.setSID(json.sid);

            createMqttClientInstance(param.instanceId, mapServer.host, json.sid);

            return {
                result: 'success',
                connectResult: json,
            };    

        } catch(e) {
            console.warn('connect error', e);
            if (e instanceof ApiException) {
                return {
                    result: 'failure',
                    error: e.apiError,
                }
            }
            return {
                result: 'failure',
                error: {
                    type: ErrorType.IllegalError,
                    detail: e + '',
                }
            }
        }
    }
)

/**
 * 地図定義ロード
 * @param mapKind ロードする地図種別。未指定の場合は、デフォルトの地図を読み込む。
 */
export const loadMapDefine = createAsyncThunk<LoadMapDefineResult, MapKind>(
    'session/loadMapDefineStatus',
    async(param, { getState }) => {
        const session = (getState() as RootState).session;
        const mapServer = session.mapServer;

        try {
            if (mapServer.host.length === 0) {
                throw 'no set mapserver';
            }
    
            if (session.connectStatus.status !== 'connected') {
                throw 'no connect map.';
            }
            const apiResult = await getAPICallerInstance((getState() as RootState).session.instanceId)?.callApi(GetMapInfoAPI, {
                mapKind: param,
            });

            return {
                result: 'success',
                mapInfo: apiResult,
            };

        } catch(e) {
            console.warn('getMapInfo error', e);
            return {
                result: 'failure',
                error: {
                    type: ErrorType.IllegalError,
                    detail: e + '',
                }
            }
        }
    }
);
