/**
 * システム全体で共通的に使用する型定義。
 * backend-main配下のものが原本。
 * 他プロジェクトへは、npm run codegenスクリプトにてコピーされる。
 */

export type DataId = {
    id: string;
    dataSourceId: string;
}

export enum MapKind {
    Real = 'Real',
    Virtual = 'Virtual'
}

export type IconKey = {
    type: 'system' | 'original';
    id: string;
}

export type IconDefine = {
    id: string;
    caption: string;
    imagePath: string;
    useMaps: MapKind[];
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

/* OSM等で管理されているFeatureを特定する情報 */
export type GeocoderIdInfo = {
    /* OSMで管理されているFeatureを特定する情報 */
    map: 'osm';
    osm_type: string;
    osm_id: number;
} | {
    /* Mapboxで管理されているFeatureを特定する情報 */
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
    geocoderId?: GeocoderIdInfo;    // OSM等で管理されているFeatureの場合
} | {
    featureType: FeatureType.TRACK;
    min_zoom: number;
    max_zoom:  number;
}

/**
 * データソース種別ごとの設定情報
 */
export enum DatasourceKindType {
    VirtualItem = 'VirtualItem',
    RealItem = 'RealItem',
    RealPointContent = 'RealPointContent',
    Track = 'Track',
    Content = 'Content',
}

/**
 * アイテムDatasourceに関する情報
 */
export type ItemDatasourceConfig = {
    kind: DatasourceKindType.RealItem | DatasourceKindType.Track | DatasourceKindType.VirtualItem;
} | {
    kind: DatasourceKindType.RealPointContent;
    defaultIcon?: IconKey;
}
/**
 * コンテンツDatasourceに関する情報
 */
export type ContentDatasourceConfig = {
    kind: DatasourceKindType.Content | DatasourceKindType.RealPointContent;
    linkableChildContents: boolean; // trueの場合、子コンテンツの追加が可能
    editable: boolean;
    deletable: boolean;
    fields: ContentFieldDefine[];
}

export type ContentFieldDefine = {
    key: string;
    type: 'title' | 'latitude' | 'longitude' | 'radius' | 'address';
} | {
    key: string;

    // stringは１行、textは複数行
    type: 'string' | 'date' | 'url' | 'text' | 'category' | 'number' | 'image';
    label: string;
    readonly?: boolean;
}

export type ContentValueMap = {[key: string]: any};
