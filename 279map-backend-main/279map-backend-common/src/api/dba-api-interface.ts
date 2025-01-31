/**
 * Odba container's API interface.
 */

import { APIDefine, CurrentMap } from "../types";
import { ContentValueMapInput, DataId, GeoProperties } from "../types-common/common-types";

type CommonParam = {
    currentMap: CurrentMap;
}

export const OdbaRegistDataAPI = {
    uri: 'regist-data',
    method: 'post',
    resultType: 'string',
} as APIDefine<OdbaRegistDataParam, DataId>;

export type OdbaRegistDataParam = CommonParam & {
    dataSourceId: string;   // 登録先データソース
    item?: {
        geometry: GeoJSON.Geometry;
        geoProperties: GeoProperties;
    };
    contents?: ContentValueMapInput;
    linkItems?: {
        id: DataId;
        fieldKey?: string;
    }[];   // 既存のアイテムに紐づける場合に指定
}

export const OdbaUpdateDataAPI = {
    uri: 'update-data',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaUpdateDataParam, DataId>;

export type OdbaUpdateDataParam = CommonParam & {
    target: {
        type: 'dataId',
        id: DataId;
    } | {
        type: 'originalId',
        originalId: string;
    };
    item?: {
        geometry: GeoJSON.Geometry;
        geoProperties: GeoProperties;
    } | null;   // nullの場合、item削除
    contents?: ContentValueMapInput;
}

export const OdbaRemoveDataAPI = {
    uri: 'remove-data',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaRemoveDataParam, boolean>;

export type OdbaRemoveDataParam = CommonParam & {
    id: DataId;
}

export const OdbaUnlinkDataAPI = {
    uri: 'unlink-data',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaUnlinkDataParam, void>;

export type OdbaUnlinkDataParam = CommonParam & {
    id: DataId;
    parent: DataId;
    fieldKey: string;  // parentのこのフィールドからのリンクを解除する
}

/**
 * get uncached data
 * 指定のデータソースIDに関して、キャッシュDBに未登録のデータを取得する
 */
export const OdbaGetUncachedDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaGetUncachedDataParam, OdbaGetUncachedDataResult>;

export type OdbaGetUncachedDataParam = CommonParam & {
    dataSourceId: string;
    nextToken?: string;
    keyword?: string;
}
export type OdbaGetUncachedDataResult = {
    contents: {
        originalId: string;
        title: string;
        overview?: string;
        hasImage?: boolean;
    }[],
    nextToken?: string;
};

/**
 * link content to item
 */
export const OdbaLinkDataAPI = {
    uri:'link-data',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaLinkDataParam, void>;

export type OdbaLinkDataParam = CommonParam & ({
    type: 'dataId',
    id: DataId;
} | {
    type: 'originalId',
    originalId: string;
}) & {
    parent: DataId;
    fieldKey?: string;  // 指定されている場合、ここで指定したフィールドにリンク追加する。未指定の場合は、追加可能なフィールドにリンク追加する。
}

export const OdbaGetImageUrlAPI = {
    uri: 'get-imageurl',
    method: 'post',
    resultType: 'string',
} as APIDefine<OdbaGetImageUrlParam, string|undefined>;
export type OdbaGetImageUrlParam = CommonParam & {
    id: DataId;
}

export const OdbaGetLinkableContentsAPI = {
    uri: 'get-linkable-contents',
    method: 'post',
    resultType: 'json',
} as APIDefine<CommonParam, OdbaGetLinkableContentsResult>;
export type OdbaGetLinkableContentsResult = {
    contents: {
        datasourceId: string;
        name: string;
    }[];
}
