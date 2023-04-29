/**
 * Odba container's API interface.
 */

import { GeoProperties, APIDefine, ContentAttr, DataId } from "../279map-common";
import { CurrentMap } from "../types";

type CommonParam = {
    currentMap: CurrentMap;
}
/**
 * regist item
 */
export const RegistItemAPI = {
    uri: 'regist-item',
    method: 'post',
    resultType: 'json',
} as APIDefine<RegistItemParam, DataId>;   // result = registed item ID

export type RegistItemParam = CommonParam & {
    dataSourceId: string;   // 登録先データソース
    name?: string;  // topography only
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;  // GeoProperties
}

/**
 * regist content
 */
export const RegistContentAPI = {
    uri: 'regist-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<RegistContentParam, void>;

export type RegistContentParam = CommonParam & {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
} & ContentAttr;

/**
 * remove item
 */
export const RemoveItemAPI = {
    uri: 'remove-item',
    method: 'post',
    resultType: 'none',
} as APIDefine<RemoveItemParam, void>;

export type RemoveItemParam = CommonParam & {
    id: DataId; // 削除対象アイテムのID
    onlyGeoInfo: boolean;   // trueの場合、地理情報のみ消す。配下のコンテンツは削除しない）
}

/**
 * remove content
 */
export const RemoveContentAPI = {
    uri: 'remove-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<RemoveContentParam, void>;

export type RemoveContentParam = CommonParam & {
    id: DataId;
    itemId: DataId;
    parentContentId?: DataId;
    mode: 'unlink' | 'alldelete';   // コンテンツデータ自体は残す場合、unlink。コンテンツデータごと削除する場合、alldelete。
}
/**
 * update item
 */
export const UpdateItemAPI = {
    uri: 'update-item',
    method: 'post',
    resultType: 'none',
} as APIDefine<UpdateItemParam, void>;

export type UpdateItemParam = CommonParam & {
    id: DataId;
    name?: string;  // topography only
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
}

/**
 * update content
 */
export const UpdateContentAPI = {
    uri: 'update-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<UpdateContentParam, void>;

export type UpdateContentParam = CommonParam & {
    id: DataId;
} & Partial<ContentAttr>;

/**
 * get unpoint data
 */
export const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetUnpointDataParam, GetUnpointDataResult>;

export type GetUnpointDataParam = CommonParam & {
    nextToken?: string;
}
export type UnpointContent = {
    id: DataId;
    title: string;
    thumb?: string;
    overview?: string;
}
export type GetUnpointDataResult = {
    contents: UnpointContent[],
    nextToken?: string;
};

/**
 * link content to item
 */
export const LinkContentToItemAPI = {
    uri:'link-content2item',
    method: 'post',
    resultType: 'none',
} as APIDefine<LinkContentToItemParam, void>;

export type LinkContentToItemParam = CommonParam & {
    childContentId: DataId;
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
}

export const GetImageUrlAPI = {
    uri: 'get-imageurl',
    method: 'get',
    resultType: 'string',
} as APIDefine<{id: DataId}, string|undefined>;

/**
 * for Android
 */
export type GetDbListResult = {
    dbList: DbInfo[];
}
export type DbInfo = {
    mapPageId: string;  // 地図ページID
    name: string;   // 地図ページ名
    dbId: string;   // 位置コンテンツDBのID
}
/**
 * registLog API
 */
 export type RegistLogRecord = {
    dbId: string;
    notionId?: string;  // データUpload後に設定される。Notionの対応するページID
    date: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    imageUri?: string; // イメージ画像URL(API側で設定される)
    content: string;
    radius?: number;    // 半径
    status: 'update' | 'delete' | undefined,    // newの場合もupdate（newかどうかはnotionId有無で判断）
}

export type NotionRegistResult = {
    notionId?: string;  // deleteの場合は、undefinedが返る
};

/**
 * getLog API
 */
export type GetLogParam = {
    dbId: string;
    nextCursor?: string;
}
export type NotionGetLogResult = {
    records: NotionLogRecordData[];
    nextCursor?: string;
}
export type NotionLogRecordData = {
    notionId: string;
    date: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    radius?: number;    // 半径指定がある場合
    thumb?: string; // サムネイル画像Base64
    content: string;
}
