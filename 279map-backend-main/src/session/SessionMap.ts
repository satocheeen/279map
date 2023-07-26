import SessionInfo, { SerializableSessionInfo } from "./SessionInfo";
import jsonfile from 'jsonfile';
import { getLogger } from "log4js";
import { CurrentMap } from "../../279map-backend-common/src";

type SessionMapTypeForStorage = {[sid: string]: SerializableSessionInfo};
type SessionMapType = {[sid: string]:  SessionInfo};

const logger = getLogger();
export default class SessionMap {
    #sessionStoragePath: string;
    #sessionMap: SessionMapType;

    constructor(sessionStoragePath: string) {
        this.#sessionStoragePath = sessionStoragePath;
        const data: SessionMapTypeForStorage = jsonfile.readFileSync(sessionStoragePath, { throws: false }) || {};
        const sessionMap: SessionMapType = {};
        Object.entries(data).forEach(entry => {
            const sid = entry[0];
            const data = entry[1];
            sessionMap[sid] = new SessionInfo(sid, data, this.#flushFile.bind(this));
        });
        this.#sessionMap = sessionMap;
    }

    removeExpiredSessions() {
        // 有効期限切れのセッションを抽出
        const expiredSessionIds = Object.entries(this.#sessionMap).filter(entry => {
            const session = entry[1];
            return session.isExpired();
        }).map(entry => entry[0]);

        logger.info('有効期限切れセッション', expiredSessionIds);
        if (expiredSessionIds.length > 0) {
            expiredSessionIds.forEach(sid => {
                delete this.#sessionMap[sid];
            });
            this.#flushFile();
        }
    }

    #flushFile() {
        const sessionMapForStorage: SessionMapTypeForStorage = {};
        Object.entries(this.#sessionMap).forEach(entry => {
            const sid = entry[0];
            const sessionInfo = entry[1];
            sessionMapForStorage[sid] = sessionInfo.toSerialize();
        });
        jsonfile.writeFileSync(this.#sessionStoragePath, sessionMapForStorage);
    }

    get(sid: string): SessionInfo | undefined {
        return this.#sessionMap[sid];
    }

    has(sid: string) {
        return sid in this.#sessionMap;
    }

    sessions() {
        return Object.values(this.#sessionMap);
    }

    createSession(sid: string, currentMap: CurrentMap): SessionInfo {
        const session = new SessionInfo(sid, { currentMap }, this.#flushFile.bind(this));
        this.#sessionMap[sid] = session;
        this.#flushFile();
        return session;
    }

    delete(sid: string) {
        delete this.#sessionMap[sid];
        this.#flushFile();
    }

    /**
     * 指定のデータソースについて、sendedItem情報をクリアする。
     * （アイテムの追加・更新・削除が行われた場合の用途）
     * @param dataSourceId 
     */
    clearSendedExtent(dataSourceId: string) {
        Object.values(this.#sessionMap).forEach(session => session.clearSendedExtent(dataSourceId));
    }

}
