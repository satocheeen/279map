import WebSocket from 'ws';
import { MapKind, ItemDefine, DataId } from '279map-backend-common';
import {CurrentMap } from '279map-backend-common';
import dayjs from 'dayjs';

type ItemInfoMap = {[dataSourceId: string]: ItemInfo[]};
type ItemInfo = {
    id: DataId;
    lastEditedTime: string;
};
const LIMIT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// ファイルバックアップ用データ
export type SerializableSessionInfo = {
    currentMap: CurrentMap;
    limit: string;
    itemsMap: ItemInfoMap;
}
type ConstructorParam = {
    currentMap: CurrentMap;
    limit?: string;
    itemsMap?: ItemInfoMap;
}

export default class SessionInfo {
    #sid: string;    // セッションID
    #ws?: WebSocket.WebSocket;   // WebSocket
    #limit: string; // 有効期限

    // 現在表示中の地図
    #currentMap: CurrentMap;

    // クライアントに送信済みのアイテム情報
    #itemsMap: ItemInfoMap = {};

    // セッション情報変更時に呼ぶ関数
    #callbackWhenUpdated: () => void;

    constructor(sid: string, param: ConstructorParam, callbackWhenUpdated: () => void) {
        this.#sid = sid;
        this.#currentMap = param.currentMap;
        // 有効期限設定
        if (param.limit) {
            this.#limit = param.limit;
        } else {
            this.#limit = this.#makeExpiredTime();
        }

        if (param.itemsMap) {
            this.#itemsMap = param.itemsMap;
        }

        this.#callbackWhenUpdated = callbackWhenUpdated;
    }

    #makeExpiredTime() {
        const now = dayjs();
        const minutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60');
        const expireDate = now.add(minutes, 'minutes').format(LIMIT_FORMAT);
        return expireDate;
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
            if (!(item.id.dataSourceId in this.#itemsMap)) {
                this.#itemsMap[item.id.dataSourceId] = [];
            }
            const dataSourceItems = this.#itemsMap[item.id.dataSourceId];
            const hit = dataSourceItems.find(it => it.id.id === item.id.id);
            if (!hit) {
                dataSourceItems.push({
                    id: item.id,
                    lastEditedTime: item.lastEditedTime,
                });
            } else {
                hit.lastEditedTime = item.lastEditedTime;
            }
        });
        this.#callbackWhenUpdated();
        // console.log('newValues', this._values.items);
    }

    removeItems(itemIds: DataId[]) {
        itemIds.forEach(itemId => {
            const dataSourceItems = this.#itemsMap[itemId.dataSourceId];
            if (!dataSourceItems) return;
            this.#itemsMap[itemId.dataSourceId] = dataSourceItems.filter(item => {
                return !itemIds.some(itemId => itemId.id === item.id.id && itemId.dataSourceId === item.id.dataSourceId);
            });
        })
        this.#callbackWhenUpdated();
    }

    resetItems() {
        this.#itemsMap = {};
        this.#callbackWhenUpdated();
    }

    /**
     * 指定のアイテムを送信済みアイテムとして保持しているかどうか
     * @param item 
     * @returns 
     */
     isSendedItem(item: ItemDefine) {
        const dataSourceItems = this.#itemsMap[item.id.dataSourceId];
        if (!dataSourceItems) return false;
        const hit = dataSourceItems.find(it => it.id.id === item.id.id);
        if (!hit) {
            return false;
        }
        return hit.lastEditedTime === item.lastEditedTime;
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

    /**
     * 有効期限切れ時間を延長する
     */
    extendExpire() {
        this.#limit = this.#makeExpiredTime();
        this.#callbackWhenUpdated();
    }

    toSerialize(): SerializableSessionInfo {
        return {
            limit: this.#limit,
            currentMap: this.#currentMap,
            itemsMap: this.#itemsMap,
        }
    }
}