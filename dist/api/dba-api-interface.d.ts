/**
 * APIのインタフェース
 */
import { ContentAttr, GeoProperties, MapKind } from "../types/common";
import { APIDefine } from "./types";
/**
 * regist item
 */
export declare const RegistItemAPI: APIDefine<RegistItemParam, string>;
export declare type RegistItemParam = {
    mapId: string;
    mapKind: MapKind;
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
};
/**
 * regist content
 */
export declare const RegistContentAPI: APIDefine<RegistContentParam, void>;
export declare type RegistContentParam = {
    mapId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
} & ContentAttr;
/**
 * remove item
 */
export declare const RemoveItemAPI: APIDefine<RemoveItemParam, void>;
export declare type RemoveItemParam = {
    id: string;
    onlyGeoInfo: boolean;
};
/**
 * remove content
 */
export declare const RemoveContentAPI: APIDefine<RemoveContentParam, void>;
export declare type RemoveContentParam = {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';
};
/**
 * update item
 */
export declare const UpdateItemAPI: APIDefine<UpdateItemParam, void>;
export declare type UpdateItemParam = {
    id: string;
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
};
/**
 * update content
 */
export declare const UpdateContentAPI: APIDefine<UpdateContentParam, void>;
export declare type UpdateContentParam = {
    id: string;
    mapId: string;
} & Partial<ContentAttr>;
/**
 * get unpoint data
 */
export declare const GetUnpointDataAPI: APIDefine<GetUnpointDataParam, GetUnpointDataResult>;
export declare type GetUnpointDataParam = {
    mapId: string;
    mapKind: MapKind;
    nextToken?: string;
};
export declare type UnpointContent = {
    id: string;
    title: string;
    thumb?: string;
    overview?: string;
};
export declare type GetUnpointDataResult = {
    contents: UnpointContent[];
    nextToken?: string;
};
/**
 * link content to item
 */
export declare const LinkContentToItemAPI: APIDefine<LinkContentToItemParam, void>;
export declare type LinkContentToItemParam = {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
};
export declare const GetImageUrlAPI: APIDefine<{
    id: string;
}, string | undefined>;
/**
 * for Android
 */
export declare type GetDbListResult = {
    dbList: DbInfo[];
};
export declare type DbInfo = {
    mapPageId: string;
    name: string;
    dbId: string;
};
/**
 * registLog API
 */
export declare type RegistLogRecord = {
    dbId: string;
    notionId?: string;
    date: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    imageUri?: string;
    content: string;
    radius?: number;
    status: 'update' | 'delete' | undefined;
};
export declare type NotionRegistResult = {
    notionId?: string;
};
/**
 * getLog API
 */
export declare type GetLogParam = {
    dbId: string;
    nextCursor?: string;
};
export declare type NotionGetLogResult = {
    records: NotionLogRecordData[];
    nextCursor?: string;
};
export declare type NotionLogRecordData = {
    notionId: string;
    date: string;
    location?: {
        longitude: number;
        latitude: number;
    };
    radius?: number;
    thumb?: string;
    content: string;
};
