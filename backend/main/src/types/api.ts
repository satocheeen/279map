import { Extent } from "ol/extent";
import GeoJSON, { GeoJsonObject } from 'geojson';
import { ContentAttr, GeocoderId, GeocoderItem, GeoProperties, MapKind } from '279map-backend-common/dist/types/common';

/**
 * API内で使用する型定義
 */
export enum Auth {
    View = 'View',
    Edit = 'Edit',
}
export type TrackGpxDefine = {
    type: 'track';
    // track_id: number;
    min_zoom: number;
    max_zoom:  number;
    geojson: string;
}
// export type TimePosition = {
//     type: 'time';
//     startDate: string;
//     time: string;
// }
export type GeoJsonPosition = {
    type: 'geoJson';
    geoJson: GeoJsonObject;
}
export type Position = GeoJsonPosition | TrackGpxDefine;

export type FeatureProperties = {
    name: string;
    lastEditedTime: string;
} & GeoProperties;

export type ItemDefine = {
    id: string;
    position: Position;
    name: string;
    geoProperties?: GeoProperties;
    lastEditedTime: string;
    contentId: string | null;
    discendantContentIds?: string[]; // 子孫コンテンツID（フィルタ判断用）
}
export type ContentsDefine = {
    id: string;
    itemId: string;
    date?: Date;
    url?: string;
    title: string;
    overview?: string;
    category?: string[];
    image?: boolean;    // 画像がある場合、true
    videoUrl?: string;  // 動画がある場合、そのURL
    parentId?: string;   // 親コンテンツが存在する場合、親コンテンツのID
    children?: ContentsDefine[];    // 子コンテンツ（SNS投稿など）
    anotherMapItemId?: string; // もう片方の地図に存在する場合、そのアイテムID
    isSnsContent: boolean;  // trueの場合、SNS等から自動連係したコンテンツ
    addableChild: boolean;  // trueの場合、子コンテンツ追加可能。SNS連携の親コンテンツは子コンテンツ追加不可なので、その制御用。
}
export type CategoryDefine = {
    name: string;
    color: string;
    contents: {
        content_id: string;
        item_id: string;
    }[];
}
export type EventDefine = {
    date: Date;
    item_id: string;
    content_id: string;
}
export type ItemAttr = {
    name: string;
    overview: string;
}




/**
 * APIのインタフェース
 */
export type APIDefine<PARAM, RESULT> = {
    uri: string;
    method: 'post' | 'get';
    param: PARAM;
    result: RESULT;
}

export const GetMapInfoAPI = {
    uri: 'getmapinfo',
    method: 'post', 
} as APIDefine<GetMapInfoParam, GetMapInfoResult>;

export const GetOriginalIconDefineAPI = {
    uri: 'get-original-icon-define',
    method: 'post',
} as APIDefine<void, GetOriginalIconDefineResult>;

export const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
} as APIDefine<GetUnpointDataParam, GetUnpointDataResult>;

export const GetCategoryAPI = {
    uri: 'getcategory',
    method: 'post',
} as APIDefine<undefined, GetCategoryResult>;

export const GetEventsAPI = {
    uri: 'getevents',
    method: 'post',
} as APIDefine<GetEventParam, GetEventsResult>;

export const GetItemsAPI = {
    uri: 'getitems',
    method: 'post',
} as APIDefine<GetItemsParam, GetItemsResult>;

export const GetContentsAPI = {
    uri: 'getcontents',
    method: 'post',
} as APIDefine<GetContentsParam, GetContentsResult>;

export const RegistItemAPI = {
    uri: 'registitem',
    method: 'post',
} as APIDefine<RegistItemParam, string>;

export const UpdateItemAPI = {
    uri: 'updateitem',
    method: 'post',
} as APIDefine<UpdateItemParam, void>;

export const RemoveItemAPI = {
    uri: 'removeitem',
    method: 'post',
} as APIDefine<RemoveItemParam, void>;

export const RegistContentAPI = {
    uri: 'registcontent',
    method: 'post',
} as APIDefine<RegistContentParam, void>;

export const UpdateContentAPI = {
    uri: 'updatecontent',
    method: 'post',
} as APIDefine<UpdateContentParam, void>;

export const RemoveContentAPI = {
    uri: 'removecontent',
    method: 'post',
} as APIDefine<RemoveContentParam, void>;

export const LinkContentToItemAPI = {
    uri: 'link-content2item',
    method: 'post',
} as APIDefine<LinkContentToItemParam, void>;

export const GetSnsPreviewAPI = {
    uri: 'getsnspreview',
    method: 'post',
} as APIDefine<GetSnsPreviewParam, GetSnsPreviewResult>;


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
    authLv: Auth;
};

export type IconDefine = {
    id: string;
    caption?: string;
    imagePath: string;
    useMaps: MapKind[];
}
export type GetOriginalIconDefineResult = IconDefine[];

export type GetItemsParam = {
    extent: Extent;
    zoom: number;
}
export type GetItemsResult = {
    items: ItemDefine[],
};

export type GetContentsParam = ({
    itemId: string;
} | {
    contentId: string;
    notContainChildren?: boolean;   // trueの場合、子孫は返さない
})[];

export type GetContentsResult = {
    contents: ContentsDefine[],
};

export type GetCategoryResult = {
    categories: CategoryDefine[];
};

export type GetEventParam = {
}
export type GetEventsResult = {
    events: EventDefine[],
};

export type RegistItemParam = ItemAttr & {
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
}

export type UpdateItemParam = Partial<ItemAttr> & {
    id: string;
    geometry?: GeoJSON.Geometry;
    geoProperties?: GeoProperties;
}

export type RemoveItemParam = {
    id: string; // 削除対象アイテムのID
    onlyGeoInfo: boolean;   // trueの場合、地理情報のみ消す。配下のコンテンツは削除しない）
}

export type RegistContentParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
} & ContentAttr;

export type UpdateContentParam = {
    id: string;
} & Partial<ContentAttr>;

export type RemoveContentParam = {
    id: string;
    itemId: string;
    parentContentId?: string;
    mode: 'unlink' | 'alldelete';   // コンテンツデータ自体は残す場合、unlink。コンテンツデータごと削除する場合、alldelete。
}
export type GetUnpointDataParam = {
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

export type GetSnsPreviewParam = {
    url: string;
}
export type SnsPreviewPost = {
    text: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date?: string;
}
export type GetSnsPreviewResult = {
    type:  'InstagramUser';
    posts: SnsPreviewPost[];
};

export type LinkContentToItemParam = {
    childContentId: string;
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
}

export type GeocoderParam = {
    address: string;
    searchTarget: ('point' | 'area')[];
}
export type GeocoderResult = GeocoderItem[];

export type GetGeocoderFeatureParam = GeocoderId;
export type GetGeoCoderFeatureResult = {
    result: 'ok';
    geoJson: GeoJsonObject;
};

export type WebSocketMessage = {
    // 地図に更新が行われた場合
    type: 'updated';
} | {
    // 地図上のアイテムが削除された場合
    type: 'delete';
    itemPageIdList: string[];
}
