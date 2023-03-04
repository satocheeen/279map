import { CategoryDefine, ContentsDefine, EventDefine, Extent, GeocoderId, GeoProperties, IconDefine, ItemDefine, MapKind, ServerConfig, UnpointContent } from "279map-common";
import { GeoJsonObject } from "geojson";
import { APIDefine, ContentAttr, SnsPreviewPost } from '279map-common';

/**
 * get common config
 */
export const ConfigAPI = {
    uri: 'config',
    method: 'get',
} as APIDefine<void, ServerConfig>;

/**
 * get map info
 */
export const GetMapInfoAPI = {
    uri: 'getmapinfo',
    method: 'post', 
} as APIDefine<GetMapInfoParam, GetMapInfoResult>;
export type GetMapInfoParam = {
    mapId: string;  // idまたはalias
    auth?: string;
    mapKind?: MapKind;
}
export type GetMapInfoResult = {
    mapId: string;      // id
    name: string;       // 地図名
    mapKind: MapKind;
    extent: Extent;
    useMaps: MapKind[],
};

/**
 * get original icon define
 */
export const GetOriginalIconDefineAPI = {
    uri: 'get-original-icon-define',
    method: 'post',
} as APIDefine<void, GetOriginalIconDefineResult>;
export type GetOriginalIconDefineResult = IconDefine[];

/**
 * get unpoint data
 */
export const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
} as APIDefine<GetUnpointDataParam, GetUnpointDataResult>;
export type GetUnpointDataParam = {
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
} as APIDefine<undefined, GetCategoryResult>;
export type GetCategoryResult = {
    categories: CategoryDefine[];
};

/**
 * get events
 */
export const GetEventsAPI = {
    uri: 'getevents',
    method: 'post',
} as APIDefine<GetEventParam, GetEventsResult>;
export type GetEventParam = {
}
export type GetEventsResult = {
    events: EventDefine[],
};

/**
 * get items
 */
export const GetItemsAPI = {
    uri: 'getitems',
    method: 'post',
} as APIDefine<GetItemsParam, GetItemsResult>;
export type GetItemsParam = {
    extent: Extent;
    zoom: number;
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
} as APIDefine<GetContentsParam, GetContentsResult>;

export type GetContentsParam = ({
    itemId: string;
} | {
    contentId: string;
    notContainChildren?: boolean;   // trueの場合、子孫は返さない
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
} as APIDefine<RegistItemParam, string>;

export type RegistItemParam = {
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
} as APIDefine<UpdateItemParam, void>;

export type UpdateItemParam = {
    id: string;
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
} as APIDefine<RemoveItemParam, void>;

export type RemoveItemParam = {
    id: string; // 削除対象アイテムのID
    onlyGeoInfo: boolean;   // trueの場合、地理情報のみ消す。（Notionのページは削除しない）
}

/**
 * regist content
 */
export const RegistContentAPI = {
    uri: 'registcontent',
    method: 'post',
} as APIDefine<RegistContentParam, void>;
export type RegistContentParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
} & ContentAttr;

/**
 * update content
 */
export const UpdateContentAPI = {
    uri: 'updatecontent',
    method: 'post',
} as APIDefine<UpdateContentParam, void>;

export type UpdateContentParam = {
    id: string;
} & Partial<ContentAttr>;

/**
 * remove content
 */
export const RemoveContentAPI = {
    uri: 'removecontent',
    method: 'post',
} as APIDefine<RemoveContentParam, void>;

export type RemoveContentParam = {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';   // コンテンツデータ自体は残す場合、unlink。コンテンツデータごと削除する場合、alldelete。
}

/**
 * link conent to item
 */
export const LinkContentToItemAPI = {
    uri: 'link-content2item',
    method: 'post',
} as APIDefine<LinkContentToItemParam, void>;

export type LinkContentToItemParam = {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
}

/**
 * get sns preview
 */
export const GetSnsPreviewAPI = {
    uri: 'getsnspreview',
    method: 'post',
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
    method: 'get',
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
export type GetGeocoderFeatureParam = GeocoderId;
export type GetGeoCoderFeatureResult = {
     result: 'ok';
     geoJson: GeoJsonObject;
};

/**
 * WebSocket
 */
export type WebSocketMessage = {
    // 地図に更新が行われた場合
    type: 'updated';
} | {
    // 地図上のアイテムが削除された場合
    type: 'delete';
    itemPageIdList: string[];
}
