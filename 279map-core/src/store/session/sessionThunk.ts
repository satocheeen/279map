import { createAsyncThunk } from "@reduxjs/toolkit";
import { callApi, getServerUrl } from "../../api/api";
import { doCommand } from "../../util/Commander";
import { RootState } from "../configureStore";
import { dataActions } from "../data/dataSlice";
import { loadCategories, loadEvents, loadOriginalIconDefine } from "../data/dataThunk";
import { GetMapInfoAPI, GetMapInfoResult, WebSocketMessage } from 'tsunagumap-api';
import { MapKind, MapDefine } from "../../279map-common";
import { ConnectResult, LoadMapDefineResult } from "../../types/types";

export const connectMap = createAsyncThunk<ConnectResult, { mapId: string; token?: string }>(
    'session/connectMapStatus',
    async(param, { getState }) => {
        const mapServer = (getState() as RootState).session.mapServer;

        try {
            const serverUrl = getServerUrl(mapServer);
    
            let url = `${serverUrl}/api/connect?mapId=${param.mapId}`;
            let headers = {};
            if (param.token) {
                headers = {
                    Authorization:  param.token ? `Bearer ${param.token}` : ''
                }
            }
            console.log('connectMap', param.token);
            const result = await fetch(url, {
                credentials: param.token ? undefined : 'include',
                headers,
            });
            if (!result.ok) {
                if (result.status === 401) {
                    return {
                        result: 'failure',
                        error: {
                            type: 'Unauthorized'
                        },
                    };
                } else if (result.status === 403) {
                    return {
                        result: 'failure',
                        error: {
                            type: 'Forbidden',
                        }
                    }
                } else {
                    throw new Error(result.statusText);
                }
            }
            const json = await result.json() as MapDefine;

            return {
                result: 'success',
                mapDefine: json,
            };    

        } catch(e) {
            console.warn('connect error', e);
            return {
                result: 'failure',
                error: {
                    type: 'ConnectError',
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
            const mapKind = param;
            const mapId = session.connectStatus.connectedMap.mapId;

            // WebSocket通信設定
            const startWss = () => {
                const protocol = 'wss';
                const domain = mapServer.domain;
        
                const wss = new WebSocket(protocol + "://" + domain);
                wss.addEventListener('open', () => {
                    console.log('websocket connected');
                    // 現在の地図情報を送信 (サーバー寸断後の再接続時用)
                    wss.send(JSON.stringify({
                        mapId,
                        mapKind,
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
        
            const apiResult = await callApi(mapServer, GetMapInfoAPI, {
                mapKind: param,
                mapId: session.connectStatus.connectedMap.mapId,  // TODO 廃止
            });

            startWss();

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
                    type: 'SessionError',
                    detail: e + '',
                }
            }
        }
    }
);
