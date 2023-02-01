import { createAsyncThunk } from "@reduxjs/toolkit";
import { callApi } from "../../api/api";
import { doCommand } from "../../util/Commander";
import { RootState } from "../configureStore";
import { dataActions } from "../data/dataSlice";
import { loadCategories, loadEvents, loadOriginalIconDefine } from "../data/dataThunk";
import { ConnectResult, GetMapInfoAPI, GetMapInfoResult, WebSocketMessage } from '279map-api-interface';
import { MapKind } from "279map-common";

export const connectMap = createAsyncThunk<ConnectResult, { mapId: string; auth?: string }>(
    'session/connectMapStatus',
    async(param, { rejectWithValue, getState, dispatch }) => {
        const mapServer = (getState() as RootState).session.mapServer;

        try {
            const protocol = mapServer.ssl ? 'https' :'http';
            const domain = mapServer.domain;
    
            let url = `${protocol}://${domain}/api/connect?mapId=${param.mapId}`;
            if (param.auth) {
                url += '&auth=' + param.auth;
            }
            const result = await fetch(url, {
                credentials: "include",
            });
            const json = await result.json() as ConnectResult;
    
            return json;

        } catch(e) {
            console.warn('connect error', e);
            return rejectWithValue(e);
        }
    }
)

/**
 * 地図定義ロード
 * @param mapKind ロードする地図種別。未指定の場合は、デフォルトの地図を読み込む。
 */
export const loadMapDefine = createAsyncThunk<GetMapInfoResult, MapKind>(
    'session/loadMapDefineStatus',
    async(param, { rejectWithValue, getState, dispatch }) => {
        const session = (getState() as RootState).session;
        const mapServer = session.mapServer;

        try {
            if (mapServer.domain.length === 0) {
                throw 'no set mapserver';
            }
    
            if (!session.connectedMap) {
                throw 'no connect map.';
            }
            const mapKind = param;
            const mapId = session.connectedMap.mapId;

            // WebSocket通信設定
            const startWss = () => {
                const protocol = mapServer.ssl ? 'wss' : 'ws';
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
                mapId: session.connectedMap.mapId,  // TODO 廃止
            });

            startWss();

            dispatch(loadOriginalIconDefine());
            dispatch(loadEvents());
            dispatch(loadCategories());

            return apiResult;

        } catch(e) {
            console.warn('getMapInfo error', e);
            return rejectWithValue(e);

        }
    }
);
