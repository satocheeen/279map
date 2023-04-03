import WebSocket from 'ws';
import { ItemDefine, MapKind } from '279map-backend-common';
import { types } from '279map-backend-common';
import dayjs from 'dayjs';
import { getSessionMap } from './SessionMap';

type ItemInfo = {
    id: string;
    lastEditedTime: string;
};

// ファイルバックアップ用データ
export type SerializableSessionInfo = {
    limit: string;
    currentMap: types.CurrentMap;
    items: ItemInfo[];
}

export default class SessionInfo {
    #sid: string;    // セッションID
    #ws?: WebSocket.WebSocket;   // WebSocket
    #limit: string; // 有効期限

    // 現在表示中の地図
    #currentMap: types.CurrentMap;

    // クライアントに送信済みのアイテム情報
    #items: ItemInfo[] = [];

    constructor(sid: string, currentMap: types.CurrentMap) {
        this.#sid = sid;
        this.#currentMap = currentMap;
        // 有効期限設定
        const now = dayjs();
        const tomorrowStr = now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
        this.#limit = tomorrowStr;
    }

    get sid() {
        return this.#sid;
    }
    
    set ws(ws: WebSocket.WebSocket | undefined) {
        this.#ws = ws;
    }

    get ws() {
        return this.#ws;
    }

    setMapKind(mapKind: MapKind) {
        this.#currentMap.mapKind = mapKind;
        getSessionMap().flushFile();
    }

    get currentMap() {
        return this.#currentMap;
    }

    addItems(items: ItemDefine[]) {
        items.forEach(item => {
            const hit = this.#items.find(it => it.id === item.id);
            if (!hit) {
                this.#items.push({
                    id: item.id,
                    lastEditedTime: item.lastEditedTime,
                });
            } else {
                hit.lastEditedTime = item.lastEditedTime;
            }
        });
        // console.log('newValues', this._values.items);
    }

    removeItems(itemId: string[]) {
        this.#items = this.#items.filter(item => {
            return !itemId.includes(item.id);
        });
    }

    /**
     * 指定のアイテムを送信済みアイテムとして保持しているかどうか
     * @param item 
     * @returns 
     */
     isSendedItem(item: ItemDefine) {
        const hit = this.#items.find(it => it.id === item.id);
        if (!hit) {
            return false;
        }
        return hit.lastEditedTime === item.lastEditedTime;
    }

    resetItems() {
        this.#items = [];
    }

    toSerialize(): SerializableSessionInfo {
        return {
            limit: this.#limit,
            currentMap: this.#currentMap,
            items: this.#items,
        }
    }
}