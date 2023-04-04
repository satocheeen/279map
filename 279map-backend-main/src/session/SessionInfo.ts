import WebSocket from 'ws';
import { ItemDefine, MapKind } from '279map-backend-common';
import { types } from '279map-backend-common';
import dayjs from 'dayjs';

type ItemInfo = {
    id: string;
    lastEditedTime: string;
};
const LIMIT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// ファイルバックアップ用データ
export type SerializableSessionInfo = {
    currentMap: types.CurrentMap;
    limit: string;
    items: ItemInfo[];
}
type ConstructorParam = {
    currentMap: types.CurrentMap;
    limit?: string;
    items?: ItemInfo[];
}

export default class SessionInfo {
    #sid: string;    // セッションID
    #ws?: WebSocket.WebSocket;   // WebSocket
    #limit: string; // 有効期限

    // 現在表示中の地図
    #currentMap: types.CurrentMap;

    // クライアントに送信済みのアイテム情報
    #items: ItemInfo[] = [];

    // セッション情報変更時に呼ぶ関数
    #callbackWhenUpdated: () => void;

    constructor(sid: string, param: ConstructorParam, callbackWhenUpdated: () => void) {
        this.#sid = sid;
        this.#currentMap = param.currentMap;
        // 有効期限設定
        if (param.limit) {
            this.#limit = param.limit;
        } else {
            const now = dayjs();
            const tomorrowStr = now.add(30, 'minutes').format(LIMIT_FORMAT);
            this.#limit = tomorrowStr;
        }

        if (param.items) {
            this.#items = param.items;
        }

        this.#callbackWhenUpdated = callbackWhenUpdated;
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
        this.#callbackWhenUpdated();
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

    /**
     * セッションが有効期限切れの場合、trueを返す
     */
    isExpired() {
        const now = dayjs();
        const limit = dayjs(this.#limit, LIMIT_FORMAT);
        const diff = now.diff(limit);
        return diff > 0;
    }

    toSerialize(): SerializableSessionInfo {
        return {
            limit: this.#limit,
            currentMap: this.#currentMap,
            items: this.#items,
        }
    }
}