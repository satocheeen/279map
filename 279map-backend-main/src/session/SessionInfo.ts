import WebSocket from 'ws';
import { MapKind, ItemDefine, DataId, Extent } from '279map-backend-common';
import {CurrentMap } from '279map-backend-common';
import dayjs from 'dayjs';
import { checkContaining } from '../util/utility';

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
    sendedExtent: SendedExtentInfo;
}
type ConstructorParam = {
    currentMap: CurrentMap;
    limit?: string;
    itemsMap?: ItemInfoMap;
    sendedExtent?: SendedExtentInfo;
}
export type SendedExtentInfo = {[dataSourceId: string]: SendedExtentByZoom};
type SendedExtentByZoom = {[zoomLv: number]: Extent[]};

export default class SessionInfo {
    #sid: string;    // セッションID
    #ws?: WebSocket.WebSocket;   // WebSocket
    #limit: string; // 有効期限

    // 現在表示中の地図
    #currentMap: CurrentMap;

    // クライアントに送信済みのアイテム情報
    #itemsMap: ItemInfoMap = {};

    // クライアントに送信済みのExtent情報。ZoomLvごとに管理。
    #sendedExtent: SendedExtentInfo = {};

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

        if (param.sendedExtent) {
            this.#sendedExtent = param.sendedExtent;
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

    get sendedExtent() {
        return this.#sendedExtent;
    }

    addItems(items: ItemDefine[], extent: Extent, zm: number) {
        const dataSourceIdSet = new Set<string>;
        items.forEach(item => {
            dataSourceIdSet.add(item.id.dataSourceId);
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

        // 送信済みExtent更新
        const zoom = Math.floor(zm);
        dataSourceIdSet.forEach(dataSourceId => {
            if (!this.#sendedExtent[dataSourceId]) {
                this.#sendedExtent[dataSourceId] = {};
            }
            const sendedExtent = this.#sendedExtent[dataSourceId];

            if (!sendedExtent[zoom]) {
                sendedExtent[zoom] = [extent];
            } else {
                let addFlag = false;
                const newSendedExtent = sendedExtent[zoom].map(ext => {
                    // 一方のExtentが包含されるなら、そちらを採用
                    const cmp = checkContaining(ext, extent);
                    if (cmp === 1) {
                        return ext;
                    } else if (cmp === 2) {
                        return extent;
                    } else {
                        addFlag = true;
                        return ext;
                    }
                })
                if (addFlag) {
                    newSendedExtent.push(extent);
                }
                sendedExtent[zoom] = newSendedExtent;
            }
    
        })

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

    /**
     * 指定のデータソースについて、sendedItem情報をクリアする。
     * （アイテムの追加・更新・削除が行われた場合の用途）
     * @param dataSourceId 
     */
    clearSendedExtent(dataSourceId: string) {
        delete this.#sendedExtent[dataSourceId];
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
        console.log('isSendedItem', item, hit.lastEditedTime === item.lastEditedTime);
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
            sendedExtent: this.#sendedExtent,
        }
    }
}