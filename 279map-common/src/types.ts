import GeoJSON from 'geojson';

export type Extent = number[];

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

// export type GeoProperties = {
//     featureType: FeatureType.STRUCTURE;
//     icon?: IconKey;
// } | {
//     featureType: FeatureType.ROAD;
//     lineJson: GeoJSON.Feature;  // 元のLine
//     width: string;  // RoadWidth.key
// } | {
//     featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
//     radius?: number;
// } | {
//     featureType: FeatureType.AREA;
//     geocoderId?: GeocoderId;    // OSM等で管理されているFeatureの場合
// } | {
//     featureType: FeatureType.TRACK;
//     min_zoom: number;
//     max_zoom:  number;
// }

export type DataId = {
    id: string;
    dataSourceId: string;
}

// export type UnpointContent = {
//     id: DataId;
//     title: string;
//     thumb?: string;
//     overview?: string;
// }
