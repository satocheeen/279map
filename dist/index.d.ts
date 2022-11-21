import GeoJSON$1, { GeoJsonObject } from 'geojson';

declare type Extent = number[];
declare enum Auth {
    View = "View",
    Edit = "Edit"
}
declare enum MapKind {
    Real = "Real",
    Virtual = "Virtual"
}
declare enum FeatureType {
    STRUCTURE = "STRUCTURE",
    ROAD = "ROAD",
    EARTH = "EARTH",
    FOREST = "FOREST",
    AREA = "AREA"
}
declare type IconInfo = {
    type: 'system' | 'original';
    id: string;
};
declare type GeocoderId = {
    map: 'osm';
    osm_type: string;
    osm_id: number;
} | {
    map: 'mapbox';
    id: string;
};
declare type GeoProperties = {
    featureType?: FeatureType.STRUCTURE;
    radius?: number;
} | {
    featureType: FeatureType.STRUCTURE;
    icon?: IconInfo;
} | {
    featureType: FeatureType.ROAD;
    lineJson: GeoJSON$1.Feature;
    width: string;
} | {
    featureType: FeatureType.EARTH | FeatureType.FOREST;
    radius?: number;
} | {
    featureType: FeatureType.AREA;
    geocoderId?: GeocoderId;
};
declare type TrackGpxDefine = {
    type: 'track';
    min_zoom: number;
    max_zoom: number;
    geojson: string;
};
declare type GeoJsonPosition = {
    type: 'geoJson';
    geoJson: GeoJsonObject;
};
declare type Position = GeoJsonPosition | TrackGpxDefine;
declare type ItemDefine = {
    id: string;
    position: Position;
    name: string;
    geoProperties?: GeoProperties;
    lastEditedTime: string;
    contentId: string | null;
    discendantContentIds?: string[];
};
declare type ContentsDefine = {
    id: string;
    itemId: string;
    date?: Date;
    url?: string;
    title: string;
    overview?: string;
    category?: string[];
    image?: boolean;
    videoUrl?: string;
    parentId?: string;
    children?: ContentsDefine[];
    anotherMapItemId?: string;
    isSnsContent: boolean;
    addableChild: boolean;
};
declare type CategoryDefine = {
    name: string;
    color: string;
    contents: {
        content_id: string;
        item_id: string;
    }[];
};
declare type EventDefine = {
    date: Date;
    item_id: string;
    content_id: string;
};
declare type IconDefine = {
    id: string;
    caption?: string;
    imagePath: string;
    useMaps: MapKind[];
};
declare type UnpointContent = {
    id: string;
    title: string;
    thumb?: string;
    overview?: string;
};

type types_d_Extent = Extent;
type types_d_Auth = Auth;
declare const types_d_Auth: typeof Auth;
type types_d_MapKind = MapKind;
declare const types_d_MapKind: typeof MapKind;
type types_d_FeatureType = FeatureType;
declare const types_d_FeatureType: typeof FeatureType;
type types_d_IconInfo = IconInfo;
type types_d_GeocoderId = GeocoderId;
type types_d_GeoProperties = GeoProperties;
type types_d_TrackGpxDefine = TrackGpxDefine;
type types_d_GeoJsonPosition = GeoJsonPosition;
type types_d_Position = Position;
type types_d_ItemDefine = ItemDefine;
type types_d_ContentsDefine = ContentsDefine;
type types_d_CategoryDefine = CategoryDefine;
type types_d_EventDefine = EventDefine;
type types_d_IconDefine = IconDefine;
type types_d_UnpointContent = UnpointContent;
declare namespace types_d {
  export {
    types_d_Extent as Extent,
    types_d_Auth as Auth,
    types_d_MapKind as MapKind,
    types_d_FeatureType as FeatureType,
    types_d_IconInfo as IconInfo,
    types_d_GeocoderId as GeocoderId,
    types_d_GeoProperties as GeoProperties,
    types_d_TrackGpxDefine as TrackGpxDefine,
    types_d_GeoJsonPosition as GeoJsonPosition,
    types_d_Position as Position,
    types_d_ItemDefine as ItemDefine,
    types_d_ContentsDefine as ContentsDefine,
    types_d_CategoryDefine as CategoryDefine,
    types_d_EventDefine as EventDefine,
    types_d_IconDefine as IconDefine,
    types_d_UnpointContent as UnpointContent,
  };
}

declare type APIDefine<PARAM, RESULT> = {
    uri: string;
    method: 'post' | 'get';
    param: PARAM;
    result: RESULT;
};
declare const GetMapInfoAPI: APIDefine<GetMapInfoParam, GetMapInfoResult>;
declare type GetMapInfoParam = {
    mapId: string;
    auth?: string;
    mapKind?: MapKind;
};
declare type GetMapInfoResult = {
    mapId: string;
    name: string;
    mapKind: MapKind;
    extent: Extent;
    useMaps: MapKind[];
    authLv: Auth;
};
declare const GetOriginalIconDefineAPI: APIDefine<void, GetOriginalIconDefineResult>;
declare type GetOriginalIconDefineResult = IconDefine[];
declare const GetUnpointDataAPI: APIDefine<GetUnpointDataParam, GetUnpointDataResult>;
declare type GetUnpointDataParam = {
    nextToken?: string;
};
declare type GetUnpointDataResult = {
    contents: UnpointContent[];
    nextToken?: string;
};
declare const GetCategoryAPI: APIDefine<undefined, GetCategoryResult>;
declare type GetCategoryResult = {
    categories: CategoryDefine[];
};
declare const GetEventsAPI: APIDefine<GetEventParam, GetEventsResult>;
declare type GetEventParam = {};
declare type GetEventsResult = {
    events: EventDefine[];
};
declare const GetItemsAPI: APIDefine<GetItemsParam, GetItemsResult>;
declare type GetItemsParam = {
    extent: Extent;
    zoom: number;
};
declare type GetItemsResult = {
    items: ItemDefine[];
};
declare const GetContentsAPI: APIDefine<GetContentsParam, GetContentsResult>;
declare type GetContentsParam = ({
    itemId: string;
} | {
    contentId: string;
    notContainChildren?: boolean;
})[];
declare type GetContentsResult = {
    contents: ContentsDefine[];
};
declare const RegistItemAPI: APIDefine<RegistItemParam, string>;
declare type RegistItemParam = {
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
};
declare const UpdateItemAPI: APIDefine<UpdateItemParam, void>;
declare type UpdateItemParam = {
    id: string;
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
};
declare const RemoveItemAPI: APIDefine<RemoveItemParam, void>;
declare type RemoveItemParam = {
    id: string;
    onlyGeoInfo: boolean;
};
declare const RegistContentAPI: APIDefine<RegistContentParam, void>;
declare type RegistContentParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
} & ContentAttr;
declare type ContentAttr = {
    title: string;
    overview: string;
    categories: string[];
} & ({
    type: 'normal';
    date?: string;
    imageUrl?: string;
} | {
    type: 'sns';
    url?: string;
});
declare const UpdateContentAPI: APIDefine<UpdateContentParam, void>;
declare type UpdateContentParam = {
    id: string;
} & Partial<ContentAttr>;
declare const RemoveContentAPI: APIDefine<RemoveContentParam, void>;
declare type RemoveContentParam = {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';
};
declare const LinkContentToItemAPI: APIDefine<LinkContentToItemParam, void>;
declare type LinkContentToItemParam = {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
};
declare const GetSnsPreviewAPI: APIDefine<GetSnsPreviewParam, GetSnsPreviewResult>;
declare type GetSnsPreviewParam = {
    url: string;
};
declare type SnsPreviewPost = {
    text: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date?: string;
};
declare type GetSnsPreviewResult = {
    type: 'InstagramUser';
    posts: SnsPreviewPost[];
};
declare const GeocoderAPI: APIDefine<GeocoderParam, GeocoderResult>;
declare type GeocoderParam = {
    address: string;
    searchTarget: ('point' | 'area')[];
};
declare type GeocoderItem = {
    idInfo: GeocoderId;
    name: string;
    geoJson: GeoJsonObject;
};
declare type GeocoderResult = GeocoderItem[];
declare type GetGeocoderFeatureParam = GeocoderId;
declare type GetGeoCoderFeatureResult = {
    result: 'ok';
    geoJson: GeoJsonObject;
};
declare type WebSocketMessage = {
    type: 'updated';
} | {
    type: 'delete';
    itemPageIdList: string[];
};

type api_d_APIDefine<_0, _1> = APIDefine<_0, _1>;
declare const api_d_GetMapInfoAPI: typeof GetMapInfoAPI;
type api_d_GetMapInfoParam = GetMapInfoParam;
type api_d_GetMapInfoResult = GetMapInfoResult;
declare const api_d_GetOriginalIconDefineAPI: typeof GetOriginalIconDefineAPI;
type api_d_GetOriginalIconDefineResult = GetOriginalIconDefineResult;
declare const api_d_GetUnpointDataAPI: typeof GetUnpointDataAPI;
type api_d_GetUnpointDataParam = GetUnpointDataParam;
type api_d_GetUnpointDataResult = GetUnpointDataResult;
declare const api_d_GetCategoryAPI: typeof GetCategoryAPI;
type api_d_GetCategoryResult = GetCategoryResult;
declare const api_d_GetEventsAPI: typeof GetEventsAPI;
type api_d_GetEventParam = GetEventParam;
type api_d_GetEventsResult = GetEventsResult;
declare const api_d_GetItemsAPI: typeof GetItemsAPI;
type api_d_GetItemsParam = GetItemsParam;
type api_d_GetItemsResult = GetItemsResult;
declare const api_d_GetContentsAPI: typeof GetContentsAPI;
type api_d_GetContentsParam = GetContentsParam;
type api_d_GetContentsResult = GetContentsResult;
declare const api_d_RegistItemAPI: typeof RegistItemAPI;
type api_d_RegistItemParam = RegistItemParam;
declare const api_d_UpdateItemAPI: typeof UpdateItemAPI;
type api_d_UpdateItemParam = UpdateItemParam;
declare const api_d_RemoveItemAPI: typeof RemoveItemAPI;
type api_d_RemoveItemParam = RemoveItemParam;
declare const api_d_RegistContentAPI: typeof RegistContentAPI;
type api_d_RegistContentParam = RegistContentParam;
type api_d_ContentAttr = ContentAttr;
declare const api_d_UpdateContentAPI: typeof UpdateContentAPI;
type api_d_UpdateContentParam = UpdateContentParam;
declare const api_d_RemoveContentAPI: typeof RemoveContentAPI;
type api_d_RemoveContentParam = RemoveContentParam;
declare const api_d_LinkContentToItemAPI: typeof LinkContentToItemAPI;
type api_d_LinkContentToItemParam = LinkContentToItemParam;
declare const api_d_GetSnsPreviewAPI: typeof GetSnsPreviewAPI;
type api_d_GetSnsPreviewParam = GetSnsPreviewParam;
type api_d_SnsPreviewPost = SnsPreviewPost;
type api_d_GetSnsPreviewResult = GetSnsPreviewResult;
declare const api_d_GeocoderAPI: typeof GeocoderAPI;
type api_d_GeocoderParam = GeocoderParam;
type api_d_GeocoderItem = GeocoderItem;
type api_d_GeocoderResult = GeocoderResult;
type api_d_GetGeocoderFeatureParam = GetGeocoderFeatureParam;
type api_d_GetGeoCoderFeatureResult = GetGeoCoderFeatureResult;
type api_d_WebSocketMessage = WebSocketMessage;
declare namespace api_d {
  export {
    api_d_APIDefine as APIDefine,
    api_d_GetMapInfoAPI as GetMapInfoAPI,
    api_d_GetMapInfoParam as GetMapInfoParam,
    api_d_GetMapInfoResult as GetMapInfoResult,
    api_d_GetOriginalIconDefineAPI as GetOriginalIconDefineAPI,
    api_d_GetOriginalIconDefineResult as GetOriginalIconDefineResult,
    api_d_GetUnpointDataAPI as GetUnpointDataAPI,
    api_d_GetUnpointDataParam as GetUnpointDataParam,
    api_d_GetUnpointDataResult as GetUnpointDataResult,
    api_d_GetCategoryAPI as GetCategoryAPI,
    api_d_GetCategoryResult as GetCategoryResult,
    api_d_GetEventsAPI as GetEventsAPI,
    api_d_GetEventParam as GetEventParam,
    api_d_GetEventsResult as GetEventsResult,
    api_d_GetItemsAPI as GetItemsAPI,
    api_d_GetItemsParam as GetItemsParam,
    api_d_GetItemsResult as GetItemsResult,
    api_d_GetContentsAPI as GetContentsAPI,
    api_d_GetContentsParam as GetContentsParam,
    api_d_GetContentsResult as GetContentsResult,
    api_d_RegistItemAPI as RegistItemAPI,
    api_d_RegistItemParam as RegistItemParam,
    api_d_UpdateItemAPI as UpdateItemAPI,
    api_d_UpdateItemParam as UpdateItemParam,
    api_d_RemoveItemAPI as RemoveItemAPI,
    api_d_RemoveItemParam as RemoveItemParam,
    api_d_RegistContentAPI as RegistContentAPI,
    api_d_RegistContentParam as RegistContentParam,
    api_d_ContentAttr as ContentAttr,
    api_d_UpdateContentAPI as UpdateContentAPI,
    api_d_UpdateContentParam as UpdateContentParam,
    api_d_RemoveContentAPI as RemoveContentAPI,
    api_d_RemoveContentParam as RemoveContentParam,
    api_d_LinkContentToItemAPI as LinkContentToItemAPI,
    api_d_LinkContentToItemParam as LinkContentToItemParam,
    api_d_GetSnsPreviewAPI as GetSnsPreviewAPI,
    api_d_GetSnsPreviewParam as GetSnsPreviewParam,
    api_d_SnsPreviewPost as SnsPreviewPost,
    api_d_GetSnsPreviewResult as GetSnsPreviewResult,
    api_d_GeocoderAPI as GeocoderAPI,
    api_d_GeocoderParam as GeocoderParam,
    api_d_GeocoderItem as GeocoderItem,
    api_d_GeocoderResult as GeocoderResult,
    api_d_GetGeocoderFeatureParam as GetGeocoderFeatureParam,
    api_d_GetGeoCoderFeatureResult as GetGeoCoderFeatureResult,
    api_d_WebSocketMessage as WebSocketMessage,
  };
}

export { api_d as api, types_d as types };
