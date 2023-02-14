import GeoJSON, { GeoJsonObject } from 'geojson';

export type Extent = number[];

export enum Auth {
    None = 'None',
    View = 'View',
    Edit = 'Edit',
}

export enum MapKind {
    Real = 'Real',
    Virtual = 'Virtual',
}

/**
 * 地図定義情報
 */
export type MapDefine = {
    mapId: string;
    name: string;
    useMaps: MapKind[];
    defaultMapKind: MapKind;
    authLv: Auth;   // ユーザの接続権限
}

/**
 * 地物種別
 * (DBに登録するので、後から増減可能なように文字列型にしている)
 */
export enum FeatureType {
    STRUCTURE = 'STRUCTURE',
    ROAD = 'ROAD',
    EARTH = 'EARTH',
    FOREST = 'FOREST',
    AREA = 'AREA',
}

export type IconInfo = {
    type: 'system' | 'original';
    id: string;
}

/**
 * OSM等で管理されているFeatureを表す情報
 */
export type GeocoderId = {
    map: 'osm';
    osm_type: string;
    osm_id: number;
} | {
    map: 'mapbox';
    id: string;
}

export type GeoProperties = {
    featureType?: FeatureType.STRUCTURE;
} | {
    featureType: FeatureType.STRUCTURE;
    icon?: IconInfo;
} | {
    featureType: FeatureType.ROAD;
    lineJson: GeoJSON.Feature;  // 元のLine
    width: string;  // RoadWidth.key
} | {
    featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    radius?: number;
} | {
    featureType: FeatureType.AREA;
    geocoderId?: GeocoderId;    // OSM等で管理されているFeatureの場合
}

/**
 * 各情報の型
 */
export type TrackGpxDefine = {
    type: 'track';
    // track_id: number;
    min_zoom: number;
    max_zoom:  number;
    geojson: string;
}
export type GeoJsonPosition = {
    type: 'geoJson';
    geoJson: GeoJsonObject;
}
export type Position = GeoJsonPosition | TrackGpxDefine;

export type ItemContentInfo = {
    id: string;
    hasImage: boolean;
    children: ItemContentInfo[];
}
export type ItemDefine = {
    id: string;
    position: Position;
    name: string;
    geoProperties?: GeoProperties;
    lastEditedTime: string;
    contents: ItemContentInfo | null;
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
    content_ids: string[];
}
export type EventDefine = {
    date: Date;
    item_id: string;
    content_id: string;
}
export type IconDefine = {
    id: string;
    caption?: string;
    imagePath: string;
    useMaps: MapKind[];
}

export type UnpointContent = {
    id: string;
    title: string;
    thumb?: string;
    overview?: string;
}

export type ContentAttr = {
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

export type SnsPreviewPost = {
    text: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date?: string;
}
