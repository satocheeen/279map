import { GeoProperties, MapKind } from "279map-common/dist/types";

export type ServerInfo = {
    domain: string;
    ssl: boolean;
}

export type MapInfo = {
    mapName: string;
    mapKind: MapKind;
}

// 地図のモード
export enum MapMode {
    Normal, // 通常
    Drawing,    // 作図中（メニュー等非表示）
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
