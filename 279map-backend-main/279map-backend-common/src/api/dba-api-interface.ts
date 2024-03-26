/**
 * Odba container's API interface.
 */

import { APIDefine, CurrentMap } from "../types";
import { ContentValueMap, DataId, GeoProperties } from "../types-common/common-types";

type CommonParam = {
    currentMap: CurrentMap;
}
/**
 * regist item
 */
export const OdbaRegistItemAPI = {
    uri: 'regist-item',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaRegistItemParam, DataId>;   // result = registed item ID

export type OdbaRegistItemParam = CommonParam & {
    dataSourceId: string;   // 登録先データソース
    name?: string;  // topography only
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
}

/**
 * regist content
 */
export const OdbaRegistContentAPI = {
    uri: 'regist-content',
    method: 'post',
    resultType: 'none',
} as APIDefine<OdbaRegistContentParam, string>;

type ContentAttr = {
    type: 'normal';
    values: ContentValueMap;
} | {
    type: 'sns';
    title: string;
    url: string;
};

export type OdbaRegistContentParam = CommonParam & {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    };
    // 登録先データソース
    contentDataSourceId: string;
} & ContentAttr;

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
    name?: string;  // topography only
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
} & ContentAttr;

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

export const OdbaLinkContentDatasourceToMapAPI = {
    uri: 'link-contentdatasource-map',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaLinkContentDatasourceToMapParam, void>;
export type OdbaLinkContentDatasourceToMapParam = CommonParam & {
    contents: {
        datasourceId: string;
        name: string;
    }[];
}

export const OdbaUnlinkContentDatasourceFromMapAPI = {
    uri: 'unlink-contentdatasource-map',
    method: 'post',
    resultType: 'json',
} as APIDefine<OdbaUnlinkContentDatasourceFromMapParam, void>;
export type OdbaUnlinkContentDatasourceFromMapParam = CommonParam & {
    contents: {
        datasourceId: string;
    }[];
}


/**
 * for Android
 */
export type OdbaGetDbListResult = {
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
