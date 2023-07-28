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

            const domain = mapServer.host;
            // WebSocket接続確立
            const startWss = () => {
                const protocol = mapServer.ssl ? 'wss' : 'ws';

                const wss = new WebSocket(protocol + "://" + domain);
                wss.addEventListener('open', () => {
                    console.log('websocket connected');
                    // セッションIDを送信
                    wss.send(JSON.stringify({
                        sid: json.sid,
                    }));

                });
                wss.addEventListener('close', () => {
                    console.log('websocket closed');
                    // サーバーが瞬断された可能性があるので再接続試行
                    startWss();
                });
                wss.addEventListener('error', (err) => {
                    console.warn('websocket error', err);
                });
                wss.addEventListener('message', (evt) => {
                    console.log('websocket message', evt.data);
                    const message = JSON.parse(evt.data) as WebSocketMessage;
                    if (message.type === 'updated') {
                        doCommand({
                            command: "LoadLatestData",
                            param: undefined,
                        });
                    } else if (message.type === 'delete') {
                        // アイテム削除
                        dispatch(dataActions.removeItems(message.itemPageIdList));
                    }
                });
            };
            // startWss();
            const mqtt = createMqttClientInstance(param.instanceId, domain, json.sid);
            mqtt.subscribe(param.mapId, () => {
                console.log('subscribe start', param.mapId)
            })
            mqtt.on('message', (topic, payload) => {
                const message = JSON.parse(new String(payload) as string) as WebSocketMessage;
                console.log('subscribe', topic, message);
                if (message.type === 'updated') {
                    doCommand({
                        command: "LoadLatestData",
                        param: undefined,
                    });
                } else if (message.type === 'delete') {
                    // アイテム削除
                    dispatch(dataActions.removeItems(message.itemPageIdList));
                }
            })

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
