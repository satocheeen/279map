/**
 * Odba container's API interface.
 */

import { APIDefine, CurrentMap } from "../types";
import { ContentValueMap, DataId, GeoProperties } from "../types-common/common-types";

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
    contents?: ContentValueMap;
    linkItems?: DataId[];   // 既存のアイテムに紐づける場合に指定
}

export const OdbaUpdateDataAPI = {
    uri: 'update-data',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaUpdateDataParam, boolean>;

export type OdbaUpdateDataParam = CommonParam & {
    id: DataId;
    item?: {
        geometry: GeoJSON.Geometry;
        geoProperties: GeoProperties;
    };
    contents?: ContentValueMap;
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
}

/**
 * get unpoint data
 */
export const OdbaGetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaGetUnpointDataParam, OdbaGetUnpointDataResult>;

export type OdbaGetUnpointDataParam = CommonParam & {
    dataSourceId: string;
    nextToken?: string;
    keyword?: string;
}
export type UnpointContent = {
    originalId: string;
    title: string;
    thumb?: string;
    overview?: string;
}
export type OdbaGetUnpointDataResult = {
    contents: UnpointContent[],
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
    id: DataId;
    parent: DataId;
} | {
    originalId: string;
    parent: DataId;
})

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
