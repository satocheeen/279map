import { ContentAttr, GeoProperties, IconDefine } from "../279map-common";
import { CSSProperties } from "react";
import { CategoryDefine, EventDefine, MapDefine, MapKind } from '../279map-common';
import { CommandHookType } from '../api/useCommand';

export type OnConnectParam = {
    result: 'success',
    mapDefine: MapDefine,
    commandHook: CommandHookType,
} | {
    result: 'Unauthorized',
} | {
    result: 'Forbidden',
}
export type TsunaguMapProps = {
    mapId: string;
    mapServerHost: string;
    token?: string;
    iconDefine?: (DefaultIconDefine | {
        // デフォルトアイコンを指定する場合に使用
        id: 'default';
        useMaps: MapKind[];
    })[];
    disabledPopup?: boolean; // when true, the map don't show popup.
    disabledLabel?: boolean; // when true, the item's label hidden.
    disabledContentDialog?: boolean;    // when true, the content dialog didn't show even if you click a item.

    filter?: FilterDefine[];

    onConnect?: (param: OnConnectParam) => void;
    onMapKindChanged?: (mapKind: MapKind) => void;
    onSelect?: (targets: string[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    onNewContentInfo?: (param: NewContentInfoParam) => void;    // callback when new content info kicked
    onEditContentInfo?: (param: EditContentInfoWithAttrParam) => void;  // callback when content edit kicked
}

export type ServerInfo = {
    domain: string;
    token?: string;
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
    attr: ContentAttr;
}

export type FilterDefine = {
    type: 'category';
    categoryName: string;
} | {
    type: 'calendar';
    date: string;   // Date.toLocaleDateString()
}
