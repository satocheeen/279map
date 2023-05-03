import { ContentAttr, DataId, GeoProperties, IconDefine, MapDefine, UnpointContent } from "../279map-common";
import { CSSProperties } from "react";
import { CategoryDefine, EventDefine, MapKind } from '../279map-common';
import { CommandHookType } from '../api/useCommand';
import { DataSourceInfo, ApiError, ConnectResult, ErrorType, GetMapInfoResult, LinkContentToItemParam, RegistContentParam, GetSnsPreviewResult, UpdateContentParam } from "tsunagumap-api";

type ConnectSuccessResult = {
    result: 'success';
    connectResult: ConnectResult;
}
export type OnMapLoadParam = {
    mapKind: MapKind;
    dataSources: DataSourceInfo[];
}
export type ApiAccessError = {
    type: ErrorType | 'UndefinedMapServer';
    detail?: string;
}
type ConnectFailureResult = {
    result: 'failure';
    error: ApiAccessError;
}
export type ConnectAPIResult = ConnectSuccessResult | ConnectFailureResult;
export type OnConnectParam = {
    result: 'success';
    mapDefine: MapDefine;
    commandHook: CommandHookType,
}  | ConnectFailureResult;
// export type OnConnectParam = (ConnectSuccessResult & {
//     commandHook: CommandHookType,
// }) | ConnectFailureResult;

export type LoadMapDefineResult = {
    result: 'success';
    mapInfo: GetMapInfoResult;
} | {
    result: 'failure';
    error: ApiError;
}

export type TsunaguMapProps = {
    mapId: string;
    mapServer: {
        host: string;
        ssl: boolean;   // SSL通信の場合、true
    };
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
    onMapLoad?: (param: OnMapLoadParam) => void;
    onSelect?: (targets: DataId[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
    onClick?: (targets: DataId[]) => void; // callback when an items are clicked.  if set this callback, cluster menu don't be shown.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    onAddNewContent?: (param: AddNewContentParam) => void;
    onLinkUnpointedContent?: (param: LinkUnpointContentParam) => void;

    onEditContentInfo?: (param: EditContentInfoWithAttrParam) => void;  // callback when content edit kicked
}

export type ServerInfo = {
    domain: string;
    ssl: boolean;
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
        itemId: DataId;
    } | {
        contentId: DataId;
    }
    mode: 'manual' | 'select-unpoint';
}
/**
 * 地図上で新規コンテンツ追加が選択された場合のコールバック
 */
export type AddNewContentParam = {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
    getSnsPreviewAPI: (url: string) => Promise<GetSnsPreviewResult>;
    registContentAPI: (param: RegistContentParam) => Promise<void>;
}
/**
 * 地図上でコンテンツ編集が選択された場合のコールバック
 */
export type EditContentParam = {
    contentId: DataId;
    currentAttr: ContentAttr;
    getSnsPreviewAPI: (url: string) => Promise<GetSnsPreviewResult>;
    updateContentAPI: (param: UpdateContentParam) => Promise<void>;
}
/**
 * 地図上で新規コンテンツ追加→未配置コンテンツが選択された場合に、コールバック関数に渡される情報
 */
export type LinkUnpointContentParam = {
    // 未配置コンテンツの紐づけ先
    parent: {
        itemId: DataId; // コンテンツをアイテム直下に紐づける場合
    } | {
        contentId: DataId;  // 子コンテンツとして紐づける場合
    }
    // コンテンツデータソース一覧
    dataSources: {
        dataSourceId: string;
        name: string;
    }[];
    // 未配置コンテンツ情報取得API
    getUnpointDataAPI: (dataSourceId: string, nextToken?: string) => Promise<{contents: UnpointContent[]; nextToken: string | undefined}>;
    // コンテンツ紐づけAPI
    linkContentToItemAPI: (param: LinkContentToItemParam) => Promise<void>;
}

export type EditContentInfoWithAttrParam = {
    contentId: DataId;
    attr: ContentAttr;
}

export type FilterDefine = {
    type: 'category';
    categoryName: string;
} | {
    type: 'calendar';
    date: string;   // Date.toLocaleDateString()
}
