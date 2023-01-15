import { GeoProperties, IconDefine, api } from "279map-common";
import { CSSProperties } from "react";

export type ServerInfo = {
    domain: string;
    ssl: boolean;
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

/**
 * アイコン定義
 */
export type SystemIconDefine = DefaultIconDefine & {
    type: 'system' | 'original',
}
export type DefaultIconDefine = IconDefine & {
    // 建物選択メニューで表示する際にCSS変更する場合に指定（色の微調整など）
    menuViewCustomCss?: CSSProperties;
    defaultColor?: string;
}

export type NewContentInfoParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
    mode: 'manual' | 'select-unpoint';
}
export type EditContentInfoWithAttrParam = {
    contentId: string;
    attr: api.ContentAttr;
}
