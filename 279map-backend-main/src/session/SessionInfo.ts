import WebSocket from 'ws';
import { CurrentMap, ItemDefine } from '279map-backend-common';
import { } from '279map-backend-common';

type ItemInfo = {
    id: string;
    lastEditedTime: string;
};

export default class SessionInfo {
    #sid: string;    // セッションID
    #ws?: WebSocket.WebSocket;   // WebSocket

    // 現在表示中の地図
    #currentMap?: CurrentMap;

    // クライアントに送信済みのアイテム情報
    #items: ItemInfo[] = [];

    constructor(sid: string) {
        this.#sid = sid;
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

    set currentMap(currentMap: CurrentMap | undefined) {
        this.#currentMap = currentMap;
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
}