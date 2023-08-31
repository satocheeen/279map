import { Auth, CategoryDefine, ContentsDefine, DataId, EventDefine, Extent, GeocoderId, GeoProperties, IconDefine, ItemDefine, MapKind, ServerConfig, UnpointContent, User } from "279map-common";
import { GeoJsonObject } from "geojson";
import { APIDefine, ContentAttr, SnsPreviewPost, MapDefine } from '279map-common';
import { FilterDefine, DataSourceGroup } from "279map-common";

/**
 * get common config
 */
export const ConfigAPI = {
    uri: 'config',
    method: 'get',
    resultType: 'json',
} as APIDefine<void, ServerConfig>;

export const GetMapListAPI = {
    uri: 'getmaplist',
    method: 'get',
    resultType: 'json',
} as APIDefine<void, MapInfo[]>;

export type MapInfo = {
    mapId: string;
    name: string;
};

export const ConnectAPI = {
    uri: 'connect',
    method: 'get',
    resultType: 'json',
} as APIDefine<ConnectParam, ConnectResult>;
export type ConnectParam = {
    mapId: string;
}
export type ConnectResult = {
    mapDefine: MapDefine;
    sid: string;   // セッションID
    userId?: string;
}

/**
 * ユーザ登録申請API
 */
export const RequestAPI = {
    uri: 'request',
    method: 'post',
    resultType: 'none',
} as APIDefine<RequestParam, void>;
export type RequestParam = {
    mapId: string;
    name: string;
}

/**
 * ユーザ権限変更API
 */
export const ChangeAuthLevelAPI = {
    uri: 'change-auth-level',
    method: 'post',
    resultType: 'none',
} as APIDefine<ChangeAuthLevelParam, void>;
export type ChangeAuthLevelParam = {
    userId: string;
    authLv: Auth;
}

/**
 * get map info
 */
export const GetMapInfoAPI = {
    uri: 'getmapinfo',
    method: 'post', 
    resultType: 'json',
} as APIDefine<GetMapInfoParam, GetMapInfoResult>;
export type GetMapInfoParam = {
    mapKind?: MapKind;
}
export type GetMapInfoResult = {
    mapKind: MapKind;
    extent: Extent;
    dataSourceGroups: DataSourceGroup[];
};

/**
 * get original icon define
 */
export const GetOriginalIconDefineAPI = {
    uri: 'get-original-icon-define',
    method: 'post',
    resultType: 'json',
} as APIDefine<void, GetOriginalIconDefineResult>;
export type GetOriginalIconDefineResult = IconDefine[];

/**
 * get unpoint data
 */
export const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetUnpointDataParam, GetUnpointDataResult>;
export type GetUnpointDataParam = {
    dataSourceId: string;
    nextToken?: string;
}
export type GetUnpointDataResult = {
    contents: UnpointContent[],
    nextToken?: string;
};

/**
 * get category
 */
export const GetCategoryAPI = {
    uri: 'getcategory',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetCategoryParam, GetCategoryResult>;
export type GetCategoryParam = {
    dataSourceIds?: string[];   // 指定されている場合、指定のデータソースのイベントのみ返す
}
export type GetCategoryResult = CategoryDefine[];

/**
 * get events
 */
export const GetEventsAPI = {
    uri: 'getevents',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetEventParam, GetEventsResult>;
export type GetEventParam = {
    dataSourceIds?: string[];   // 指定されている場合、指定のデータソースのイベントのみ返す
}
export type GetEventsResult = EventDefine[];

/**
 * get items
 */
export const GetItemsAPI = {
    uri: 'getitems',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetItemsParam, GetItemsResult>;
export type GetItemsParam = {
    extent: Extent;
    zoom: number;
    dataSourceIds: string[];   // 指定のデータソースのアイテムのみ返す
}
export type GetItemsResult = {
    items: ItemDefine[],
};

/**
 * get contents
 */
export const GetContentsAPI = {
    uri: 'getcontents',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetContentsParam, GetContentsResult>;

export type GetContentsParam = ({
    itemId: DataId;
} | {
    contentId: DataId;
})[];

export type GetContentsResult = {
    contents: ContentsDefine[],
};

/**
 * regist item
 */
export const RegistItemAPI = {
    uri: 'registitem',
    method: 'post',
    resultType: 'json',
} as APIDefine<RegistItemParam, DataId>;

export type RegistItemParam = {
    dataSourceId: string;   // 登録先データソース
    name?: string;  // only topography.  the structures' name is decided by content's name.
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
}

/**
 * update item
 */
export const UpdateItemAPI = {
    uri: 'updateitem',
    method: 'post',
    resultType: 'none',
} as APIDefine<UpdateItemParam, void>;

export type UpdateItemParam = {
    id: DataId;
    name?: string;  // only topography.  the structures' name is decided by content's name.
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
}

/**
 * remove item
 */
export const RemoveItemAPI = {
    uri: 'removeitem',
    method: 'post',
    resultType: 'none',
} as APIDefine<RemoveItemParam, void>;

export type RemoveItemParam = {
    id: DataId; // 削除対象アイテムのID
}

/**
 * regist content
 */
export const RegistContentAPI = {
    uri: 'registcontent',
    method: 'post',
    resultType: 'none',
} as APIDefine<RegistContentParam, void>;
export type RegistContentParam = {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    };
    // 登録先データソース
    contentDataSourceId: string;
} & ContentAttr;

/**
 * update content
 */
export const UpdateContentAPI = {
    uri: 'updatecontent',
    method: 'post',
    resultType: 'none',
} as APIDefine<UpdateContentParam, void>;

export type UpdateContentParam = {
    id: DataId;
} & Partial<ContentAttr>;

/**
 * remove content
 */
export const RemoveContentAPI = {
    uri: 'removecontent',
    method: 'post',
    resultType: 'none',
} as APIDefine<RemoveContentParam, void>;

export type RemoveContentParam = {
    id: DataId;
    itemId: DataId;
    parentContentId?: DataId;
    mode: 'unlink' | 'alldelete';   // コンテンツデータ自体は残す場合、unlink。コンテンツデータごと削除する場合、alldelete。
}

/**
 * link conent to item
 */
export const LinkContentToItemAPI = {
    uri: 'link-content2item',
    method: 'post',
    resultType: 'none',
} as APIDefine<LinkContentToItemParam, void>;

export type LinkContentToItemParam = {
    childContentId: DataId;
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
}

/**
 * search items and contents
 */
export const SearchAPI = {
    uri: 'search',
    method: 'post',
    resultType: 'json',
} as APIDefine<SearchParam, SearchResult>;

export type SearchParam = {
    conditions: FilterDefine[];
    dataSourceIds?: string[];   // 指定されている場合、指定のデータソースのみ検索対象にする
}

export type SearchResult = {
    // 検索条件に合致するアイテム
    items: {
        id: DataId;
        contents: DataId[]; // 当該アイテム配下の検索条件に合致するコンテンツID一覧 TODO: 孫コンテンツも含める
    }[];
}

export const GetThumbAPI = {
    uri: 'getthumb',
    method: 'get',
    resultType: 'blob',
} as APIDefine<GetThumbParam, Blob>;
export type GetThumbParam = {
    // TODO: DataIdに変更
    id: string;
}

export const GetImageUrlAPI = {
    uri: 'get-imageurl',
    method: 'post',
    resultType: 'string',
} as APIDefine<{id: DataId}, string|undefined>;

/**
 * get sns preview
 */
export const GetSnsPreviewAPI = {
    uri: 'getsnspreview',
    method: 'post',
    resultType: 'json',
} as APIDefine<GetSnsPreviewParam, GetSnsPreviewResult>;
export type GetSnsPreviewParam = {
    url: string;
}
export type GetSnsPreviewResult = {
    type:  'InstagramUser';
    posts: SnsPreviewPost[];
};

/**
 * search address
 */
export const GeocoderAPI = {
    uri: 'geocoder',
    method: 'post',
    resultType: 'json',
} as APIDefine<GeocoderParam, GeocoderResult>;

export type GeocoderParam = {
    address: string;
    searchTarget: ('point' | 'area')[];
}
export type GeocoderItem = {
    idInfo: GeocoderId;
    name: string;
    geoJson: GeoJsonObject;
}
export type GeocoderResult = GeocoderItem[];

/**
 * get geocoder feature
 */
export const GetGeocoderFeatureAPI = {
    uri: 'getGeocoderFeature',
    method: 'get',
    resultType: 'json',
} as APIDefine<GetGeocoderFeatureParam, GetGeoCoderFeatureResult>;

export type GetGeocoderFeatureParam = GeocoderId;
export type GetGeoCoderFeatureResult = {
    geoJson: GeoJsonObject;
};

export const GetUserListAPI = {
    uri: 'getuserlist',
    method: 'post',
    resultType: 'json',
} as APIDefine<void, GetUserListResult>;
export type GetUserListResult = {
    users: User[];
}

/**
 * Publishメッセージ（ユーザに対するもの）
 */
export type PublishUserMessage = {
    // ユーザ権限に更新があった場合
    type: 'update-userauth';
}

/**
 * Publishメッセージ（地図に対するもの）
 */
export type PublishMapMessage = {
    // 地図に更新が行われた場合
    type: 'mapitem-update';
    subtype?: undefined;
    extent: Extent; // 更新された範囲
} | {
    // 地図上のアイテムが削除された場合
    type: 'mapitem-delete';
    subtype?: undefined;
    itemPageIdList: DataId[];
} | {
    // ユーザ一覧情報が更新された場合
    type: 'userlist-update';
    subtype?: undefined;
} | {
    // 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合
    type: 'childcontents-update';
    subtype: DataId;
}
