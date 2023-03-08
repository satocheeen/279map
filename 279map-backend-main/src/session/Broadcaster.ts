import WebSocket from 'ws';
import { getLogger } from 'log4js';
import { Server } from 'http';
import { Request } from 'express';
import SessionInfo from './SessionInfo';
import { MapKind } from '279map-common';
import { WebSocketMessage } from '../../279map-api-interface/src';
import { getSessionIdFromCookies } from './session_utility';

/**
 * クライアントの情報を管理し、必要に応じてクライアントに通知を行うクラス
 */
export default class Broadcaster {
    _logger = getLogger('api');
    _wss: WebSocket.Server;
    _sessionMap = {} as {[sid: string]: SessionInfo};

    constructor(server: Server) {
        this._wss = new WebSocket.Server({ server });

        this._wss.on('error', (e) => {
            this._logger.warn('ws error', e);
        });

        this._wss.on('connection', (ws, req) => {
            // SessionID取得
            const sid = getSessionIdFromCookies(req);
            if (!sid) {
                this._logger.warn('WebSocket connected failed. can not get sid.');
                return;
            }

            // WebSocketを保存
            this._logger.debug('WebSocket connect', sid, Object.keys(this._sessionMap));
            if (this._sessionMap[sid] === undefined) {
                // 先にhttp接続によりセッション情報が生成されているはずだが、
                // サーバー寸断時にはこのルートにくる。
                this._logger.warn('session recreate', sid);
                this._sessionMap[sid] = new SessionInfo(sid);
            }
            this._sessionMap[sid].ws = ws;
        
            // サーバー寸断時の再接続考慮
            ws.on('message', (message) => {
                if (this._sessionMap[sid] === undefined) {
                    this._logger.warn('session recreate', sid);
                    this._sessionMap[sid] = new SessionInfo(sid);
                    this._sessionMap[sid].ws = ws;
                }
                const info = JSON.parse(message.toString());
                this._sessionMap[sid].currentMap = {
                    mapId: info.mapId,
                    mapKind: info.mapKind,
                }
            });

            ws.on('close', () => {
                this._logger.info('Close Session', sid);
                this._sessionMap[sid]?.resetItems();

                // delete this._sessionMap[sid];
                this._logger.debug('disconnect', this._sessionMap);
            });
        });
        
    }
    
    addSession(sid: string): SessionInfo {
        if (!sid) {
            this._logger.warn('[addSession] sid not found');
            throw '[addSession] sid not found';
        }
        if (this._sessionMap[sid]) {
            this._logger.info('[addSession] session already exist', sid);
            return this._sessionMap[sid];
        }
        this._logger.info('[addSession] make a new session', sid);
        this._sessionMap[sid] = new SessionInfo(sid);
        return this._sessionMap[sid];
    }

    removeSession(sid: string) {
        delete this._sessionMap[sid];
    }

    getSessionInfo(sid: string) {
        return this._sessionMap[sid];
    }

    getCurrentMap(sid: string) {
        return this.getSessionInfo(sid)?.currentMap;
    }

    /**
     * 指定の地図に対してアイテム追加された際に呼び出される。
     * @param mapPageId 
     * @param itemIdList 追加されたアイテムID一覧
     */
    broadCastAddItem(mapPageId: string, itemIdList: string[]) {
        // 接続しているユーザに最新情報を取得するように通知
        this.#broadcast(mapPageId, undefined, {
            type: 'updated',
        });
    }

    broadCastUpdateItem(mapPageId: string, itemIdList: string[]) {
        // 送信済みアイテム情報から当該アイテムを除去する
        Object.values(this._sessionMap).forEach(client => {
            client.removeItems(itemIdList);
        });
        // 接続しているユーザに最新情報を取得するように通知
        this.#broadcast(mapPageId, undefined, {
            type: 'updated',
        });
    }

    broadCastDeleteItem(mapPageId: string, itemIdList: string[]) {
        // 送信済みアイテム情報から当該アイテムを除去する
        Object.values(this._sessionMap).forEach(client => {
            client.removeItems(itemIdList);
        });
        // 接続しているユーザにアイテム削除するように通知
        this.#broadcast(mapPageId, undefined, {
            type: 'delete',
            itemPageIdList: itemIdList,
        });
    }

    /**
     * 対象の地図に接続しているユーザに対して、通知を一斉送信する
     * @param mapPageId 対象の地図ページID
     * @param mapKind 対象の地図種別。未指定の場合は、地図種別に関わらず送信する。
     * @param message 送信する通知
     */
    #broadcast(mapPageId: string, mapKind: MapKind | undefined, message: WebSocketMessage) {
        this._logger.debug('broadcast', mapKind, message);
        Object.values(this._sessionMap).forEach(client => {
            if (!client.ws || !client.currentMap) {
                return;
            }
            if (client.currentMap.mapId !== mapPageId) {
                return;
            }
            if (mapKind && client.currentMap.mapKind !== mapKind) {
                return;
            }
            client.ws.send(JSON.stringify(message));
            this._logger.debug('send', client.sid);
        })
    }

    /**
     * 指定のリクエストクライアントが接続する地図と同じ地図ユーザに対して、通知を一斉送信する
     * @param req
     * @param message 
     * @returns 
     */
    broadcastSameMap(req: Request, message: WebSocketMessage) {
        const currentMap = this.getCurrentMap(req.sessionID);
        if (!currentMap) {
            return;
        }
        this.#broadcast(currentMap.mapId, currentMap.mapKind, message);
    }

}