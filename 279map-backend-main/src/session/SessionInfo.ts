import { MapKind, DataId } from '279map-common';
import dayjs from 'dayjs';
import { CurrentMap, ItemDefine } from '../../279map-backend-common/src';
import { RegistItemParam, UpdateItemParam } from '../../279map-api-interface/dist';
import { createHash } from '../util/utility';
import { GeoProperties } from '279map-common';

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
}
type ConstructorParam = {
    currentMap: CurrentMap;
    limit?: string;
    itemsMap?: ItemInfoMap;
}
type TemporaryItem = {
    currentMap: CurrentMap;
    name: string;
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
} & ({
    type: 'regist';
    dataSourceId: string;
} | {
    type: 'update';
    id: DataId,
});

export default class SessionInfo {
    #sid: string;    // セッションID
    #limit: string; // 有効期限

    // 現在表示中の地図
    #currentMap: CurrentMap;

    // セッション情報変更時に呼ぶ関数
    #callbackWhenUpdated: () => void;

    #temporaryItemMap = new Map<string, TemporaryItem>();

    constructor(sid: string, param: ConstructorParam, callbackWhenUpdated: () => void) {
        this.#sid = sid;
        this.#currentMap = param.currentMap;
        // 有効期限設定
        if (param.limit) {
            this.#limit = param.limit;
        } else {
            this.#limit = this.#makeExpiredTime();
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
    
    setMapKind(mapKind: MapKind) {
        this.#currentMap.mapKind = mapKind;
        this.#callbackWhenUpdated();
    }

    get currentMap() {
        return this.#currentMap;
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

    /**
     * 登録処理中のアイテムを仮登録する
     * @param currentMap 
     * @param registItemParam 
     * @return id。メモリから除去する際(removeTemporaryItem)に、このidを指定。
     */
    addTemporaryRegistItem(currentMap: CurrentMap, registItemParam: RegistItemParam) {
        const processId = createHash();
        this.#temporaryItemMap.set(processId, {
            type: 'regist',
            currentMap,
            dataSourceId: registItemParam.dataSourceId,
            geometry: registItemParam.geometry,
            geoProperties:registItemParam.geoProperties,
            name: registItemParam.name ?? '',
        })

        return processId;
    }

    /**
     * 更新処理中のアイテムを仮更新する
     * @param currentMap 
     * @param updateItemParam 
     * @returns 
     */
    addTemporaryUpdateItem(currentMap: CurrentMap, currentItem: ItemDefine, updateItemParam: UpdateItemParam['targets'][0]) {
        const processId = createHash();
        this.#temporaryItemMap.set(processId, {
            type: 'update',
            currentMap,
            id: updateItemParam.id,
            geometry: updateItemParam.geometry ?? currentItem.geoJson,
            geoProperties:updateItemParam.geoProperties ?? currentItem.geoProperties,
            name: updateItemParam.name ?? currentItem.name,
        })

        return processId;
    }

    /**
     * 仮登録したアイテムを削除する
     * @param id addTemporaryItemで返却したid
     */
    removeTemporaryItem(id: string) {
        this.#temporaryItemMap.delete(id);
    }

    /**
     * 仮登録中の情報をitemsに反映する
     * @param items
     * @param currentMap 
     */
    mergeTemporaryItems(items: ItemDefine[], currentMap: CurrentMap) {
        for(const [key, item] of this.#temporaryItemMap.entries()) {
            if (item.currentMap.mapId !== currentMap.mapId || item.currentMap.mapKind !== currentMap.mapKind) {
                continue;
            }
            if (item.type === 'regist') {
                items.push({
                    id: {
                        id: key,
                        dataSourceId: item.dataSourceId,
                    },
                    name: item.name,
                    geoJson: item.geometry,
                    geoProperties: item.geoProperties,
                    lastEditedTime: '',
                    contents: [],
                    isTemporary: true,
                })
            } else {
                items.push({
                    id: item.id,
                    name: item.name,
                    geoJson: item.geometry,
                    geoProperties: item.geoProperties,
                    lastEditedTime: '',
                    contents: [],
                    isTemporary: true,
                })
            }
        }
    }

    toSerialize(): SerializableSessionInfo {
        return {
            limit: this.#limit,
            currentMap: this.#currentMap,
        }
    }
}