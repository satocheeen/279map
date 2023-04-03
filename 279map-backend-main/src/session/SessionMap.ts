import SessionInfo, { SerializableSessionInfo } from "./SessionInfo";
import jsonfile from 'jsonfile';

type SessionMapTypeForStorage = {[sid: string]: SerializableSessionInfo};
type SessionMapType = {[sid: string]:  SessionInfo};

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
            sessionMap[sid] = new SessionInfo(sid, data.currentMap, this.flushFile.bind(this));
        });
        this.#sessionMap = sessionMap;
    }

    flushFile() {
        const sessionMapForStorage: SessionMapTypeForStorage = {};
        Object.entries(this.#sessionMap).forEach(entry => {
            const sid = entry[0];
            const sessionInfo = entry[1];
            sessionMapForStorage[sid] = sessionInfo.toSerialize();
        });
        jsonfile.writeFileSync(this.#sessionStoragePath, sessionMapForStorage);
    }

    get(sid: string) {
        return this.#sessionMap[sid];
    }

    has(sid: string) {
        return sid in this.#sessionMap;
    }

    set(sid: string, session: SessionInfo) {
        this.#sessionMap[sid] = session;
        this.flushFile();
    }

    delete(sid: string) {
        delete this.#sessionMap[sid];
        this.flushFile();
    }
}
