import GeoJSON, { GeoJsonObject } from 'geojson';
export declare type Extent = [number, number, number, number];
export declare enum Auth {
    View = "View",
    Edit = "Edit"
}
export declare enum MapKind {
    Real = "Real",
    Virtual = "Virtual"
}
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
export declare type TrackGpxDefine = {
    type: 'track';
    min_zoom: number;
    max_zoom: number;
    geojson: string;
};
export declare type GeoJsonPosition = {
    type: 'geoJson';
    geoJson: GeoJsonObject;
};
export declare type Position = GeoJsonPosition | TrackGpxDefine;
export declare type ItemDefine = {
    id: string;
    position: Position;
    name: string;
    geoProperties?: GeoProperties;
    lastEditedTime: string;
    contentId: string | null;
    discendantContentIds?: string[];
};
export declare type ContentsDefine = {
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
export declare type CategoryDefine = {
    name: string;
    color: string;
    contents: {
        content_id: string;
        item_id: string;
    }[];
};
export declare type EventDefine = {
    date: Date;
    item_id: string;
    content_id: string;
};
export declare type IconDefine = {
    id: string;
    caption?: string;
    imagePath: string;
    useMaps: MapKind[];
};
export declare type UnpointContent = {
    id: string;
    title: string;
    thumb?: string;
    overview?: string;
};
