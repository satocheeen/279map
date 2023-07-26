import { getLogger } from 'log4js';
import { Server } from 'http';
import { Request } from 'express';
import mosca from 'mosca';
import { WebSocketMessage } from '../../279map-api-interface/src';
import { DataId, MapKind } from '279map-common';
import SessionInfo from './SessionInfo';
import { CurrentMap } from '../../279map-backend-common/src';
import SessionMap from './SessionMap';
import crypto from 'crypto';

const apiLogger = getLogger('api');
export default class MqttBroadcaster {
    #server: mosca.Server;
    #sessionMap: SessionMap;

    constructor(server: Server, sessionStoragePath: string) {
        this.#sessionMap = new SessionMap(sessionStoragePath);
        this.#server = new mosca.Server({});
        this.#server.attachHttpServer(server);

        this.#server.on('ready', () => console.log('Mosca Serve is ready'));

        this.#server.on('clientConnected', (client: any) => {
            apiLogger.info('mqtt client conneted', client.id);
        });

        
    }

    /**
     * 有効期限切れセッションを削除する
     */
    removeExpiredSessions() {
    }

    createSession(currentMap: CurrentMap): SessionInfo {
        // SID生成
        let sid: string | undefined;
        do {
            const hash = createHash();
            if (!this.#sessionMap.has(hash)) {
                sid = hash;
            }
        } while(sid === undefined);

        const session = this.#sessionMap.createSession(sid, currentMap);
        apiLogger.info('[createSession] make a new session', sid);

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
     * 指定のデータソースについて、sendedItem情報をクリアする。
     * （アイテムの追加・更新・削除が行われた場合の用途）
     * @param dataSourceId 
     */
    clearSendedExtent(dataSourceId: string) {
        this.#sessionMap.clearSendedExtent(dataSourceId);
    }

    /**
     * 指定の地図に対してアイテム追加された際に呼び出される。
     * @param mapPageId 
     * @param itemIdList 追加されたアイテムID一覧
     */
    broadCastAddItem(mapPageId: string, itemIdList: DataId[]) {
    }

    broadCastUpdateItem(mapPageId: string, itemIdList: DataId[]) {
    }

    broadCastDeleteItem(mapPageId: string, itemIdList: DataId[]) {
    }

    /**
     * 対象の地図に接続しているユーザに対して、通知を一斉送信する
     * @param mapPageId 対象の地図ページID
     * @param mapKind 対象の地図種別。未指定の場合は、地図種別に関わらず送信する。
     * @param message 送信する通知
     */
    #broadcast(mapPageId: string, mapKind: MapKind | undefined, message: WebSocketMessage) {
    }

    /**
     * 指定のリクエストクライアントが接続する地図と同じ地図ユーザに対して、通知を一斉送信する
     * @param req
     * @param message 
     * @returns 
     */
    broadcastSameMap(req: Request, message: WebSocketMessage) {
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