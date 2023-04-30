import { createAsyncThunk } from "@reduxjs/toolkit";
import { doCommand } from "../../util/Commander";
import { RootState } from "../configureStore";
import { dataActions } from "../data/dataSlice";
import { loadCategories, loadEvents, loadOriginalIconDefine } from "../data/dataThunk";
import { ApiError, ConnectAPI, ErrorType, GetMapInfoAPI, WebSocketMessage } from 'tsunagumap-api';
import { MapKind } from "../../279map-common";
import { ConnectAPIResult, LoadMapDefineResult } from "../../types/types";
import { createAPICallerInstance, getAPICallerInstance } from "../../api/ApiCaller";
import { sessionActions } from "./sessionSlice";

export const connectMap = createAsyncThunk<ConnectAPIResult, { mapId: string; token?: string }>(
    'session/connectMapStatus',
    async(param, { getState, dispatch }) => {
        const mapServer = (getState() as RootState).session.mapServer;

        try {
            const apiCaller = createAPICallerInstance(mapServer, (error: ApiError) => {
                // コネクションエラー時
                dispatch(sessionActions.updateConnectStatus({
                    status: 'failure',
                    error,
                }));
            });
            const json = await apiCaller.callApi(ConnectAPI, {
                mapId: param.mapId,
            });

            apiCaller.setSID(json.sid);

            // WebSocket接続確立
            const startWss = () => {
                const protocol = mapServer.ssl ? 'wss' : 'ws';
                const domain = mapServer.domain;

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
            startWss();

            return {
                result: 'success',
                connectResult: json,
            };    

        } catch(e) {
            console.warn('connect error', e);
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
    async(param, { getState, dispatch }) => {
        const session = (getState() as RootState).session;
        const mapServer = session.mapServer;

        try {
            if (mapServer.domain.length === 0) {
                throw 'no set mapserver';
            }
    
            if (session.connectStatus.status !== 'connected') {
                throw 'no connect map.';
            }
            // const mapKind = param;
            // const mapId = session.connectStatus.connectedMap.mapId;

            const apiResult = await getAPICallerInstance()?.callApi(GetMapInfoAPI, {
                mapKind: param,
            });

            dispatch(loadOriginalIconDefine());
            dispatch(loadEvents());
            dispatch(loadCategories());

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
