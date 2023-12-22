import GeoJSON from 'geojson';

export type Extent = number[];

export enum AuthMethod {
    None = "None",
    Auth0 = "Auth0",
    Original = "Original",
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
    authMethod: AuthMethod.None | AuthMethod.Original;
}

/**
 * データソース種別
 */
export enum DataSourceKindType {
    Item = 'Item',                  // 位置情報（村マップ、世界地図 両用）データソース
    RealPointContent = 'RealPointContent',        // 位置情報（世界地図のみ）+コンテンツ データソース
    Content = 'Content',            // コンテンツデータソース
    Track = 'Track'                 // 軌跡情報が登録されたデータソース
}
/**
 * データソースの種別定義
 */
export type DatasourceConfig = {
    editable: boolean;
    deletable: boolean;
} & ({
    kind: DataSourceKindType.Item;
    layerGroup?: string;
} | {
    kind: DataSourceKindType.RealPointContent;
    defaultIcon?: IconKey;
    layerGroup?: string;
    linkableContents: boolean;
} | {
    kind: DataSourceKindType.Track;
    layerGroup?: string;
} | {
    kind: DataSourceKindType.Content;
    linkableChildContents: boolean; // 子コンテンツの追加が可能かどうか
    disableUnlinkMap?: boolean;     // trueの場合、当該コンテンツデータソースを地図から外すこと不可
});

export type DataSourceInfo = DatasourceConfig & {
    dataSourceId: string;
    name: string;
    visible: boolean;
}

export type DataSourceGroup = {
    name?: string;
    visible: boolean;
    dataSources: DataSourceInfo[];
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

export type IconKey = {
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
    icon?: IconKey;
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
