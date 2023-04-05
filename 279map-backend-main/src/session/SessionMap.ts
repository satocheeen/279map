import SessionInfo, { SerializableSessionInfo } from "./SessionInfo";
import jsonfile from 'jsonfile';
import { types } from '279map-backend-common';
import { getLogger } from "log4js";

type SessionMapTypeForStorage = {[sid: string]: SerializableSessionInfo};
type SessionMapType = {[sid: string]:  SessionInfo};

const logger = getLogger();
export default class SessionMap {
    #sessionStoragePath: string;
    #sessionMap: SessionMapType;

    constructor(sessionStoragePath: string) {
        this.#sessionStoragePath = sessionStoragePath;
        const data: SessionMapTypeForStorage = jsonfile.readFileSync(sessionStoragePath, { throws: true }) || {};
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

    createSession(sid: string, currentMap: types.CurrentMap): SessionInfo {
        const session = new SessionInfo(sid, { currentMap }, this.#flushFile.bind(this));
        this.#sessionMap[sid] = session;
        this.#flushFile();
        return session;
    }

    delete(sid: string) {
        delete this.#sessionMap[sid];
        this.#flushFile();
    }
}
