import GeoJSON, { GeoJsonObject } from 'geojson';
/**
 * システム全体（フロントエンド、バックエンド）で共通の型定義
 */
export declare enum MapKind {
    Real = "Real",
    Virtual = "Virtual"
}
/**
 * 地物種別
 * (DBに登録するので、後から増減可能なように文字列型にしている)
 */
export declare enum FeatureType {
    STRUCTURE = "STRUCTURE",
    ROAD = "ROAD",
    EARTH = "EARTH",
    FOREST = "FOREST",
    AREA = "AREA"
}
export declare type IconInfo = {
    type: 'system' | 'original';
    id: string;
};
export declare type GeocoderId = {
    map: 'osm';
    osm_type: string;
    osm_id: number;
} | {
    map: 'mapbox';
    id: string;
};
export declare type GeocoderItem = {
    idInfo: GeocoderId;
    name: string;
    geoJson: GeoJsonObject;
};
export declare type GeoProperties = {
    featureType?: FeatureType.STRUCTURE;
    radius?: number;
} | {
    featureType: FeatureType.STRUCTURE;
    icon?: IconInfo;
} | {
    featureType: FeatureType.ROAD;
    lineJson: GeoJSON.Feature;
    width: string;
} | {
    featureType: FeatureType.EARTH | FeatureType.FOREST;
    radius?: number;
} | {
    featureType: FeatureType.AREA;
    geocoderId?: GeocoderId;
};
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
