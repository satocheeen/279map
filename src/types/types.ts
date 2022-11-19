import { GeoProperties } from "279map-common/dist/types";

// 地図のモード
export enum Mode {
    Normal,
    SelectPosition,
}

export enum UrlType {
    // Youtube,
    FacebookVideo = 'FacebookVideo',
    Note = 'Note',
    Twitter = 'Twitter',
    Other = 'Other',
}

export type FeatureProperties = {
    name: string;
    lastEditedTime: string;
} & GeoProperties;
