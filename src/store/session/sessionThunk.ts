import { api, MapKind } from "279map-common";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { callApi } from "../../api/api";
import { doCommand } from "../../util/Commander";
import { RootState } from "../configureStore";
import { dataActions } from "../data/dataSlice";

export const connectMap = createAsyncThunk<api.ConnectResult, { mapId: string; auth?: string }>(
    'session/loadMapDefineStatus',
    async(param, { rejectWithValue, getState, dispatch }) => {
        const mapServer = (getState() as RootState).session.mapServer;

        let wss: WebSocket;
        // WebSocket通信設定
        const startWss = () => {
            const protocol = mapServer.ssl ? 'wss' : 'ws';
            const domain = mapServer.domain;
    
            wss = new WebSocket(protocol + "://" + domain);
            wss.addEventListener('open', () => {
                console.log('websocket connected');
                // 現在の地図情報を送信 (サーバー寸断後に再接続時)
                const session = (getState() as RootState).session;
                if (session.connectedMap) {
                    wss?.send(JSON.stringify({
                        mapId: session.connectedMap.mapId,
                        mapKind: session.currentMapKindInfo?.mapKind,
                    }));
                }
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
                const message = JSON.parse(evt.data) as api.WebSocketMessage;
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
        
        try {
            const protocol = mapServer.ssl ? 'https' :'http';
            const domain = mapServer.domain;
    
            const url = `${protocol}://${domain}/api/connect?mapId=${param.mapId}`;
            const result = await fetch(url, {
                credentials: "include",
            });
            const json = await result.json() as api.ConnectResult;
    
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
export const loadMapDefine = createAsyncThunk<api.GetMapInfoResult, MapKind>(
    'session/loadMapDefineStatus',
    async(param, { rejectWithValue, getState }) => {
        const session = (getState() as RootState).session;
        const mapServer = session.mapServer;
        try {
            if (!session.connectedMap) {
                throw 'no connect map.';
            }
            const apiResult = await callApi(mapServer, api.GetMapInfoAPI, {
                mapKind: param,
                mapId: session.connectedMap.mapId,  // TODO 廃止
            });

            return apiResult;

        } catch(e) {
            console.warn('getMapInfo error', e);
            return rejectWithValue(e);

        }
    }
);
