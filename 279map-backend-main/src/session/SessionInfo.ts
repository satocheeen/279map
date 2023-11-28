import { MapKind, DataId } from '279map-common';
import dayjs from 'dayjs';
import { CurrentMap } from '../../279map-backend-common/src';
import { RegistItemParam } from '../../279map-api-interface/dist';
import { createHash } from '../util/utility';
import { ItemDefine, ItemTemporaryState, UpdateItemInput } from '../graphql/__generated__/types';

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
type TemporaryItem = Omit<ItemDefine, 'id'|'lastEditedTime'> & {
    currentMap: CurrentMap;
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
            geoJson: registItemParam.geometry,
            geoProperties:registItemParam.geoProperties,
            name: registItemParam.name ?? '',
            hasContents: false,
            hasImageContentId: [],
        })

        return processId;
    }

    /**
     * 更新処理中のアイテムを仮更新する
     * @param currentMap 
     * @param updateItemParam 
     * @returns 
     */
    addTemporaryUpdateItem(currentMap: CurrentMap, currentItem: ItemDefine, updateItemParam: UpdateItemInput) {
        const processId = createHash();
        this.#temporaryItemMap.set(processId, {
            type: 'update',
            currentMap,
            id: updateItemParam.id,
            geoJson: updateItemParam.geometry ?? currentItem.geoJson,
            geoProperties:updateItemParam.geoProperties ?? currentItem.geoProperties,
            name: updateItemParam.name ?? currentItem.name,
            hasContents: currentItem.hasContents,
            hasImageContentId: currentItem.hasImageContentId,
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
     * 仮登録中の情報をitemsに追加する
     * @param items
     * @param currentMap 
     */
    addTemporaryItems(items: ItemDefine[], currentMap: CurrentMap) {
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
                    geoJson: item.geoJson,
                    geoProperties: item.geoProperties,
                    lastEditedTime: '',
                    hasContents: item.hasContents,
                    hasImageContentId: item.hasImageContentId,
                    temporary: ItemTemporaryState.Registing,
                })
            } else {
                items.push({
                    id: item.id,
                    name: item.name,
                    geoJson: item.geoJson,
                    geoProperties: item.geoProperties,
                    lastEditedTime: '',
                    hasContents: item.hasContents,
                    hasImageContentId: item.hasImageContentId,
                    temporary: ItemTemporaryState.Updateing,
                })
            }
        }
    }

    /**
     * itemsに存在するもののうち、temporaryデータが存在するものは上書きする。
     * また、targetsに存在する新規追加対象のものは追加する。
     * @param items 
     * @param currentMap 
     * @param targets 
     */
    mergeTemporaryItems(items: ItemDefine[], currentMap: CurrentMap, targets: DataId[]) {
        for(const [key, item] of this.#temporaryItemMap.entries()) {
            if (item.currentMap.mapId !== currentMap.mapId || item.currentMap.mapKind !== currentMap.mapKind) {
                continue;
            }
            if (item.type === 'regist') {
                const hit = targets.some(t => t.dataSourceId === item.dataSourceId && t.id === key);
                if (hit) {
                    items.push({
                        id: {
                            id: key,
                            dataSourceId: item.dataSourceId,
                        },
                        name: item.name,
                        geoJson: item.geoJson,
                        geoProperties: item.geoProperties,
                        lastEditedTime: '',
                        hasContents: item.hasContents,
                        hasImageContentId: item.hasImageContentId,
                        temporary: ItemTemporaryState.Registing,
                    })
                }
                continue;
            }
            const index = items.findIndex(i => i.id.id === item.id.id && i.id.dataSourceId === item.id.dataSourceId);
            if (index === -1) continue;
            items[index] = {
                id: item.id,
                name: item.name,
                hasContents: item.hasContents,
                hasImageContentId: item.hasImageContentId,
                geoJson: item.geoJson,
                geoProperties: item.geoProperties,
                lastEditedTime: '',
                temporary: ItemTemporaryState.Updateing,
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