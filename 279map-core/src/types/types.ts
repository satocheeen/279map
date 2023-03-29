import { ContentAttr, GeoProperties, IconDefine, UnpointContent } from "../279map-common";
import { CSSProperties } from "react";
import { CategoryDefine, EventDefine, MapDefine, MapKind } from '../279map-common';
import { CommandHookType } from '../api/useCommand';
import { LinkContentToItemParam, RegistContentParam } from "tsunagumap-api";

export type ConnectError = {
    type: 'Unauthorized' | 'Forbidden' | 'ConnectError';
    detail?: string;
}
type ConnectSuccessResult = {
    result: 'success',
    mapDefine: MapDefine,
}
type ConnectFailureResult = {
    result: 'failure',
    error: ConnectError;
}
export type ConnectResult = ConnectSuccessResult | ConnectFailureResult;
export type OnConnectParam = (ConnectSuccessResult & {
    commandHook: CommandHookType,
}) | ConnectFailureResult;

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
    onClick?: (targets: string[]) => void; // callback when an items are clicked.  if set this callback, cluster menu don't be shown.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    // TODO: deprecated
    onNewContentInfo?: (param: NewContentInfoParam) => void;    // callback when new content info kicked

    onNewContentByManual?: (param: NewContentByManualParam) => void;
    onLinkUnpointedContent?: (param: LinkUnpointContentParam) => void;

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
/**
 * 地図上で新規コンテンツ追加が選択された場合のコールバック
 */
export type NewContentByManualParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
    registContentAPI: (param: RegistContentParam) => Promise<void>;
}
/**
 * 地図上で新規コンテンツ追加→未配置コンテンツが選択された場合のコールバック
 */
export type LinkUnpointContentParam = {
    parent: {
        itemId: string;
    } | {
        contentId: string;
    }
    getUnpointDataAPI: (nextToken?: string) => Promise<{contents: UnpointContent[]; nextToken: string | undefined}>;
    linkContentToItemAPI: (param: LinkContentToItemParam) => Promise<void>;
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
