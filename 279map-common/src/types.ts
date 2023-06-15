import GeoJSON, { GeoJsonObject } from 'geojson';

export type Extent = number[];

export enum AuthMethod {
    None = 'None',
    Direct = 'Direct',
    Auth0 = 'Auth0',
}

// サーバーからフロントエンドに渡すConfig情報
export type ServerConfig = {
    authMethod: AuthMethod.Auth0;
    auth0: {
        domain: string;
        clientId: string;
        audience: string;
    }
} | {
    authMethod: AuthMethod.None | AuthMethod.Direct;
}

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
 * データソース種別
 */
export enum DataSourceKindType {
    Item = 'Item',                  // 位置情報のみ登録されたデータソース
    Content = 'Content',            // コンテンツのみ登録されたデータソース
    ItemContent = 'ItemContent',    // 1レコードに位置情報とコンテンツが登録されているデータソース
    Track = 'Track'                 // 軌跡情報が登録されたデータソース
}
/**
 * データソースのコンテンツ紐づけ定義。
 * （アイテムやコンテンツの配下に紐づけるコンテンツに関する定義）
 */
export enum DataSourceLinkableContent {
    None = 'None',      // コンテンツが紐づけられない場合
    Single = 'Single',  // 単一コンテンツの紐づけが可能な場合
    Multi = 'Multi',    // 複数コンテンツの紐づけが可能な場合
}

export interface MapPageOptions {
    popupMode?: 'hidden' | 'minimum' | 'maximum';
    itemLabel?: 'show' | 'hidden';
    // 初期表示するデータソースを絞る場合に指定する
    visibleDataSources?: ({
        dataSourceId: string;
    } | {
        group: string;
    })[];
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
    userName: string;
    options?: MapPageOptions;
}
export type DataSourceGroup = {
    name?: string;
    visible: boolean;
    dataSources: DataSourceInfo[];
}
export type DataSourceInfo = {
    dataSourceId: string;
    name: string;
    kind: DataSourceKindType;
    editable: boolean;
    deletable: boolean;
    linkableContent: DataSourceLinkableContent;
    visible: boolean;
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
    TRACK = 'TRACK',
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
} | {
    featureType: FeatureType.TRACK;
    min_zoom: number;
    max_zoom:  number;
}

export type DataId = {
    id: string;
    dataSourceId: string;
}

export type ItemContentInfo = {
    id: DataId;
    hasImage: boolean;
    children: ItemContentInfo[];
}
export type ItemDefine = {
    id: DataId;
    name: string;
    geoJson: GeoJsonObject;
    geoProperties: GeoProperties;
    lastEditedTime: string;
    contents: ItemContentInfo[];
}
export type ContentsDefine = {
    id: DataId;
    itemId: DataId;
    date?: string;
    url?: string;
    title: string;
    overview?: string;
    category?: string[];
    image?: boolean;    // 画像がある場合、true
    videoUrl?: string;  // 動画がある場合、そのURL
    parentId?: DataId;   // 親コンテンツが存在する場合、親コンテンツのID
    children?: ContentsDefine[];    // 子コンテンツ（SNS投稿など）
    usingAnotherMap: boolean;   // 他の地図（もう片方のMapKindや、全く別の地図）で使用されている場合、true。（完全削除防止用）
    anotherMapItemId?: DataId; // もう片方の地図に存在する場合、そのアイテムID
    isSnsContent: boolean;  // trueの場合、SNS等から自動連係したコンテンツ

    isEditable: boolean;
    isDeletable: boolean;
    isUnlinkable: boolean;
}
export type CategoryDefine = {
    name: string;
    color: string;
    dataSourceIds: string[];    // カテゴリが使用されているデータソースID一覧
}
/**
 * データソース単位のイベント情報
 */
export type EventDefine = {
    dataSourceId: string;
    dates: string[];   // 日付文字列 または 日時文字列
}
export type IconDefine = {
    id: string;
    caption?: string;
    imagePath: string;
    useMaps: MapKind[];
}

export type UnpointContent = {
    id: DataId;
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

export type FilterDefine = {
    type: 'category';
    category: string;
} | {
    type: 'calendar';
    date: string;   // YYYY-MM-DD 形式で指定
} | {
    type: 'keyword';
    keyword: string;
}
