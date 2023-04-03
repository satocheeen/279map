import WebSocket from 'ws';
import { getLogger } from 'log4js';
import { Server } from 'http';
import { Request } from 'express';
import SessionInfo from './SessionInfo';
import { MapKind } from '279map-backend-common';
import { WebSocketMessage } from '../../279map-api-interface/src';
import { getSessionIdFromCookies } from './session_utility';
import crypto from 'crypto';
import { types } from '279map-backend-common';
import SessionMap from './SessionMap';

/**
 * クライアントの情報を管理し、必要に応じてクライアントに通知を行うクラス
 */
export default class Broadcaster {
    _logger = getLogger('api');
    _wss: WebSocket.Server;
    #sessionMap: SessionMap;

    constructor(server: Server, sessionStoragePath: string) {
        this.#sessionMap = new SessionMap(sessionStoragePath);
        this._wss = new WebSocket.Server({ server });

        this._wss.on('error', (e) => {
            this._logger.warn('ws error', e);
        });

        this._wss.on('connection', (ws, req) => {
            // WebSocket通信確立後、フロントエンドからSessionIDが送られてくるので、
            // SessionMapから対応するSessionInfoを取得して、ws設定
            let sid: string | undefined;
            ws.on('message', (message) => {
                const info = JSON.parse(message.toString());
                sid = info.sid as string;
                this._logger.debug('WebSocket connect', sid);
                this.#sessionMap.get(sid).ws = ws;
            });

            ws.on('close', () => {
                if (!sid) return;
                this._logger.info('Close Session', sid);
                this.#sessionMap.delete(sid);
            });
        });
        
    }

    createSession(currentMap: types.CurrentMap): SessionInfo {
        // SID生成
        let sid: string | undefined;
        do {
            const hash = createHash();
            if (!this.#sessionMap.has(hash)) {
                sid = hash;
            }
        } while(sid === undefined);

        const session = new SessionInfo(sid, currentMap, () => {
            this.#sessionMap.flushFile();
        });
        this.#sessionMap.set(sid, session);
        this._logger.info('[createSession] make a new session', sid);

        return session;
    }
    
    removeSession(sid: string) {
        this.#sessionMap.delete(sid);
    }

    getSessionInfo(sid: string) {
        return this.#sessionMap.get(sid);
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
        Object.values(this.#sessionMap).forEach(client => {
            client.removeItems(itemIdList);
        });
        // 接続しているユーザに最新情報を取得するように通知
        this.#broadcast(mapPageId, undefined, {
            type: 'updated',
        });
    }

    broadCastDeleteItem(mapPageId: string, itemIdList: string[]) {
        // 送信済みアイテム情報から当該アイテムを除去する
        Object.values(this.#sessionMap).forEach(client => {
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
        Object.values(this.#sessionMap).forEach(client => {
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
        if (!req.connect) {
            this._logger.debug('no connect');
            return;
        }
        const currentMap = this.getCurrentMap(req.connect.sessionKey);
        if (!currentMap) {
            this._logger.debug('no currentmap');
            return;
        }
        this.#broadcast(currentMap.mapId, currentMap.mapKind, message);
    }

}

function createHash(): string {
    // 生成するハッシュの長さ（バイト数）
    const hashLength = 32;

    // ランダムなバイト列を生成する
    const randomBytes = crypto.randomBytes(hashLength);

    // バイト列をハッシュ化する
    const hash = crypto.createHash('sha256').update(randomBytes).digest('hex');

    return hash;
}