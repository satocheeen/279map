import { Auth, CategoryDefine, ContentsDefine, EventDefine, Extent, GeocoderId, GeoProperties, IconDefine, ItemDefine, MapKind, UnpointContent } from "./types";
import { GeoJsonObject } from "geojson";
export declare type APIDefine<PARAM, RESULT> = {
    uri: string;
    method: 'post' | 'get';
    param: PARAM;
    result: RESULT;
};
export declare const GetMapInfoAPI: APIDefine<GetMapInfoParam, GetMapInfoResult>;
export declare type GetMapInfoParam = {
    mapId: string;
    auth?: string;
    mapKind?: MapKind;
};
export declare type GetMapInfoResult = {
    mapId: string;
    name: string;
    mapKind: MapKind;
    extent: Extent;
    useMaps: MapKind[];
    authLv: Auth;
};
export declare const GetOriginalIconDefineAPI: APIDefine<void, GetOriginalIconDefineResult>;
export declare type GetOriginalIconDefineResult = IconDefine[];
export declare const GetUnpointDataAPI: APIDefine<GetUnpointDataParam, GetUnpointDataResult>;
export declare type GetUnpointDataParam = {
    nextToken?: string;
};
export declare type GetUnpointDataResult = {
    contents: UnpointContent[];
    nextToken?: string;
};
export declare const GetCategoryAPI: APIDefine<undefined, GetCategoryResult>;
export declare type GetCategoryResult = {
    categories: CategoryDefine[];
};
export declare const GetEventsAPI: APIDefine<GetEventParam, GetEventsResult>;
export declare type GetEventParam = {};
export declare type GetEventsResult = {
    events: EventDefine[];
};
export declare const GetItemsAPI: APIDefine<GetItemsParam, GetItemsResult>;
export declare type GetItemsParam = {
    extent: Extent;
    zoom: number;
};
export declare type GetItemsResult = {
    items: ItemDefine[];
};
export declare const GetContentsAPI: APIDefine<GetContentsParam, GetContentsResult>;
export declare type GetContentsParam = ({
    itemId: string;
} | {
    contentId: string;
    notContainChildren?: boolean;
})[];
export declare type GetContentsResult = {
    contents: ContentsDefine[];
};
export declare const RegistItemAPI: APIDefine<RegistItemParam, string>;
export declare type RegistItemParam = {
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
};
export declare const UpdateItemAPI: APIDefine<UpdateItemParam, void>;
export declare type UpdateItemParam = {
    id: string;
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
};
export declare const RemoveItemAPI: APIDefine<RemoveItemParam, void>;
export declare type RemoveItemParam = {
    id: string;
    onlyGeoInfo: boolean;
};
export declare const RegistContentAPI: APIDefine<RegistContentParam, void>;
export declare type RegistContentParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
} & ContentAttr;
export declare type ContentAttr = {
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
export declare const UpdateContentAPI: APIDefine<UpdateContentParam, void>;
export declare type UpdateContentParam = {
    id: string;
} & Partial<ContentAttr>;
export declare const RemoveContentAPI: APIDefine<RemoveContentParam, void>;
export declare type RemoveContentParam = {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';
};
export declare const LinkContentToItemAPI: APIDefine<LinkContentToItemParam, void>;
export declare type LinkContentToItemParam = {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    };
};
export declare const GetSnsPreviewAPI: APIDefine<GetSnsPreviewParam, GetSnsPreviewResult>;
export declare type GetSnsPreviewParam = {
    url: string;
};
export declare type SnsPreviewPost = {
    text: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date?: string;
};
export declare type GetSnsPreviewResult = {
    type: 'InstagramUser';
    posts: SnsPreviewPost[];
};
export declare const GeocoderAPI: APIDefine<GeocoderParam, GeocoderResult>;
export declare type GeocoderParam = {
    address: string;
    searchTarget: ('point' | 'area')[];
};
export declare type GeocoderItem = {
    idInfo: GeocoderId;
    name: string;
    geoJson: GeoJsonObject;
};
export declare type GeocoderResult = GeocoderItem[];
export declare type GetGeocoderFeatureParam = GeocoderId;
export declare type GetGeoCoderFeatureResult = {
    result: 'ok';
    geoJson: GeoJsonObject;
};
export declare type WebSocketMessage = {
    type: 'updated';
} | {
    type: 'delete';
    itemPageIdList: string[];
};
