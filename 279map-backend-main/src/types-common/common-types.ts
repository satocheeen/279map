/**
 * システム全体で共通的に使用する型定義。
 * backend-main配下のものが原本。
 * 他プロジェクトへは、npm run codegenスクリプトにてコピーされる。
 */

export type DataId = {
    id: string;
    dataSourceId: string;
}

export type IconKey = {
    type: 'system' | 'original';
    id: string;
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
    kind: DatasourceKindType.RealItem | DatasourceKindType.RealPointContent | DatasourceKindType.Track | DatasourceKindType.VirtualItem;
}
/**
 * コンテンツDatasourceに関する情報
 */
export type ContentDatasourceConfig = {
    linkableChildContents: boolean; // trueの場合、子コンテンツの追加が可能
    editable: boolean;
    deletable: boolean;
    fields: ContentFieldDefine[];
} & (
    {
        // 現実世界地図用の位置コンテンツレイヤ
        kind: DatasourceKindType.RealPointContent;
        defaultIcon?: IconKey;
    } | {
        kind: DatasourceKindType.Content;
    }
)

export type ContentFieldDefine = {
    key: string;
    type: 'title' | 'url' | 'latitude' | 'longitude' | 'radius' | 'address';
} | {
    key: string;
    type: 'date' | 'text' | 'category' | 'number' | 'image';
    label: string;
}

export type ContentValueMap = {[key: string]: any};
