/**
 * Odba container's API interface.
 */

import { GeoProperties, MapKind, APIDefine, ContentAttr } from "279map-common";
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
} as APIDefine<RegistItemParam, string>;   // result = registed item ID

export type RegistItemParam = CommonParam & {
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
} as APIDefine<RegistContentParam, void>;

export type RegistContentParam = CommonParam & {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
} & ContentAttr;

/**
 * remove item
 */
export const RemoveItemAPI = {
    uri: 'remove-item',
    method: 'post',
} as APIDefine<RemoveItemParam, void>;

export type RemoveItemParam = CommonParam & {
    id: string; // 削除対象アイテムのID
    onlyGeoInfo: boolean;   // trueの場合、地理情報のみ消す。配下のコンテンツは削除しない）
}

/**
 * remove content
 */
export const RemoveContentAPI = {
    uri: 'remove-content',
    method: 'post',
} as APIDefine<RemoveContentParam, void>;

export type RemoveContentParam = CommonParam & {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';   // コンテンツデータ自体は残す場合、unlink。コンテンツデータごと削除する場合、alldelete。
}
/**
 * update item
 */
export const UpdateItemAPI = {
    uri: 'update-item',
    method: 'post',
} as APIDefine<UpdateItemParam, void>;

export type UpdateItemParam = CommonParam & {
    id: string;
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
} as APIDefine<UpdateContentParam, void>;

export type UpdateContentParam = CommonParam & {
    id: string;
} & Partial<ContentAttr>;

/**
 * get unpoint data
 */
export const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
} as APIDefine<GetUnpointDataParam, GetUnpointDataResult>;

export type GetUnpointDataParam = CommonParam & {
    nextToken?: string;
}
export type UnpointContent = {
    id: string;
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
    method: 'post'
} as APIDefine<LinkContentToItemParam, void>;

export type LinkContentToItemParam = CommonParam & {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
}

export const GetImageUrlAPI = {
    uri: 'get-imageurl',
    method: 'get',
} as APIDefine<{id: string}, string|undefined>;

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
