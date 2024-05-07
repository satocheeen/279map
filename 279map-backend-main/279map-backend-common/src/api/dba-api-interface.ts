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

/**
 * regist content
 */
export const OdbaRegistContentAPI = {
    uri: 'regist-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaRegistContentParam, DataId>;

export type OdbaRegistContentParam = CommonParam & {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    };
    // 登録先データソース
    contentDataSourceId: string;
    values: ContentValueMap;
};

/**
 * remove item
 */
export const OdbaRemoveItemAPI = {
    uri: 'remove-item',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaRemoveItemParam, void>;

export type OdbaRemoveItemParam = CommonParam & {
    id: DataId; // 削除対象アイテムのID
}

/**
 * remove content
 */
export const OdbaRemoveContentAPI = {
    uri: 'remove-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaRemoveContentParam, void>;

export type OdbaRemoveContentParam = CommonParam & {
    id: DataId;
}

export const OdbaUnlinkContentAPI = {
    uri: 'unlink-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaUnlinkContentParam, void>;

export type OdbaUnlinkContentParam = CommonParam & {
    id: DataId;
    parent: {
        type: 'item';
        itemId: DataId;
    } | {
        type: 'content';
        contentId: DataId;
    }
}

/**
 * update item
 */
export const OdbaUpdateItemAPI = {
    uri: 'update-item',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaUpdateItemParam, void>;

export type OdbaUpdateItemParam = CommonParam & {
    id: DataId;
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
}

/**
 * update content
 */
export const OdbaUpdateContentAPI = {
    uri: 'update-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaUpdateContentParam, void>;

export type OdbaUpdateContentParam = CommonParam & {
    id: DataId;
    values: ContentValueMap;
};

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
    id: DataId;
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
export const OdbaLinkContentToItemAPI = {
    uri:'link-content2item',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaLinkContentToItemParam, void>;

export type OdbaLinkContentToItemParam = CommonParam & {
    childContentId: DataId;
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
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
