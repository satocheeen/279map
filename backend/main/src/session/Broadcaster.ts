import WebSocket from 'ws';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { getLogger } from 'log4js';
import { SessionSecretKey } from '../config';
import { WebSocketMessage } from '279map-common/dist/api';
import { IncomingMessage, Server } from 'http';
import { Request } from 'express';
import SessionInfo from './SessionInfo';
import { MapKind } from '279map-common/dist/types';

/**
 * クライアントの情報を管理し、必要に応じてクライアントに通知を行うクラス
 */
export default class Broadcaster {
    _logger = getLogger();
    _wss: WebSocket.Server;
    _sessionMap = {} as {[sid: string]: SessionInfo};

    constructor(server: Server) {
        this._wss = new WebSocket.Server({ server });

        this._wss.on('error', (e) => {
            this._logger.warn('ws error', e);
        });

        this._wss.on('connection', (ws, req) => {
            // SessionID取得
            const sid = this.getSessionId(req);
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
                console.log('receive ws', message);
                if (this._sessionMap[sid] === undefined) {
                    this._logger.warn('session recreate', sid);
                    this._sessionMap[sid] = new SessionInfo(sid);
                    this._sessionMap[sid].ws = ws;
                }
                const info = JSON.parse(message.toString());
                this._sessionMap[sid].currentMap = {
                    mapPageId: info.mapId,
                    mapKind: info.mapKind,
                }
            });

            ws.on('close', () => {
                this._logger.info('Close Session', sid);
                this._sessionMap[sid]?.resetItems();

                // delete this._sessionMap[sid];
                console.log('disconnect', this._sessionMap);
            });
        });
        
    }
    
    getSessionId(req: IncomingMessage) {
        if (!req.headers.cookie) {
            this._logger.warn('WebSocket connected failed. can not get cookie.');
            return;
        }
        const cookies = cookie.parse(req.headers.cookie);
        this._logger.debug('connect.sid', cookies["connect.sid"]);
        return cookies["connect.sid"];
        // const sid = cookieParser.signedCookie(cookies["connect.sid"], SessionSecretKey);
        // this._logger.debug('connect.sid', cookies["connect.sid"], 'sid', sid, 'SessionSecretKey', SessionSecretKey);
        // return sid;
    }

    addSession(req: Request): SessionInfo | undefined {
        const sid = this.getSessionId(req);
        // const sid = req.sessionID;
        if (!sid) {
            return undefined;
        }
        if (this._sessionMap[sid]) {
            return this._sessionMap[sid];
        }
        this._logger.info('Add Session', sid);
        this._sessionMap[sid] = new SessionInfo(sid);
        return this._sessionMap[sid];
    }

    removeSession(req: Request) {
        const sid = this.getSessionId(req);
        if (!sid) {
            return;
        }
        delete this._sessionMap[sid];
    }

    getSessionInfo(req: Request) {
        const sid = this.getSessionId(req);
        if (!sid) {
            return undefined;
        }
        return this._sessionMap[sid];
    }

    getCurrentMap(req: Request) {
        return this.getSessionInfo(req)?.currentMap;
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
        console.log('broadcast', mapKind, message);
        Object.values(this._sessionMap).forEach(client => {
            if (!client.ws || !client.currentMap) {
                return;
            }
            if (client.currentMap.mapPageId !== mapPageId) {
                return;
            }
            if (mapKind && client.currentMap.mapKind !== mapKind) {
                return;
            }
            client.ws.send(JSON.stringify(message));
            console.log('send', client.sid);
        })
    }

    /**
     * 指定のリクエストクライアントが接続する地図と同じ地図ユーザに対して、通知を一斉送信する
     * @param req
     * @param message 
     * @returns 
     */
    broadcastSameMap(req: Request, message: WebSocketMessage) {
        const currentMap = this.getCurrentMap(req);
        if (!currentMap) {
            return;
        }
        this.#broadcast(currentMap.mapPageId, currentMap.mapKind, message);
    }

}