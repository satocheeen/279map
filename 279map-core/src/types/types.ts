import { ContentAttr, DataId, DataSourceGroup, FeatureType, GeoProperties, IconDefine, MapDefine, UnpointContent } from "279map-common";
import { CSSProperties } from "react";
import { CategoryDefine, EventDefine, MapKind } from '279map-common';
import { ApiError, ConnectResult, ErrorType, GetMapInfoResult, LinkContentToItemParam, RegistContentParam, GetSnsPreviewResult, UpdateContentParam, GetUnpointDataResult } from "tsunagumap-api";
import { FilterDefine } from "279map-common";
import { LoadContentsParam, LoadContentsResult } from "../store/data/dataThunk";

type ConnectSuccessResult = {
    result: 'success';
    connectResult: ConnectResult;
}
export type OnMapLoadParam = {
    mapKind: MapKind;
}
export type onDatasourceChangedParam = {
    dataSourceGroups: DataSourceGroup[];
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
}  | ConnectFailureResult;

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
        token?: string;
    };
    iconDefine?: (DefaultIconDefine | {
        // デフォルトアイコンを指定する場合に使用
        id: 'default';
        useMaps: MapKind[];
    })[];
    /**
     * ポップアップ表示モード
     * - hidden: ポップアップ表示しない
     * - minimum: 小さなポップアップを表示する
     * - maximum: 大きいポップアップ（画像表示）を表示する（デフォルト）
     */
    popupMode?: 'hidden' | 'minimum' | 'maximum';
    disabledLabel?: boolean; // when true, the item's label hidden.
    disabledContentDialog?: boolean;    // when true, the content dialog didn't show even if you click a item.

    filter?: {
        conditions: FilterDefine[];
        unmatchView: 'hidden' | 'translucent';  // how view the items unmatched with conditions
    }

    onConnect?: (param: OnConnectParam) => void;
    onMapLoad?: (param: OnMapLoadParam) => void;
    onDatasourceChanged?: (param: onDatasourceChangedParam) => void;
    onSelect?: (targets: DataId[]) => void; // callback when items are selected
    onClick?: (targets: DataId[]) => void; // callback when an items are clicked.  if set this callback, cluster menu don't be shown.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    // callback when kick the action to create a new content
    onAddNewContent?: (param: AddNewContentParam) => void;
    // callback when kick the action to edit a content
    onEditContent?: (param: EditContentParam) => void;
    // callback when kick the action to link a content with an item or a content
    onLinkUnpointedContent?: (param: LinkUnpointContentParam) => void;
}

export interface TsunaguMapHandler {
    /**
     * switch the map kind
     * 表示する地図種別の切り替え
     */
    switchMapKind(mapKind: MapKind): void;

    /**
     * focus the item
     * 指定のアイテムにフォーカスする
     * @param itemId フォーカス対象のアイテムid
     * @param opts フォーカスする際のオプション
     */
    focusItem(itemId: DataId, opts?: {zoom?: boolean}): void;

    /**
     * start the spte of drawing a structure (or a pin).
     * 建設または地点登録する
     */
    drawStructure(dataSourceId: string): void;

    /**
     * start the step of moving a structure (or a pin).
     * 移築または地点移動する
     */
    moveStructure(): void;

    /**
     * start the step of changing a structure's icon.
     * 改築（建物変更）する
     */
    changeStructure(): void;

    /**
     * start the step of removing a structure.
     * 建物解体する
     */
    removeStructure(): void;

    /**
     * start the step of drawing a land, a green field or an area.
     * 島or緑地orエリアを作成する
     */
    drawTopography(dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA):void;

    /**
     * start the step of drawing a road.
     * 道を作成する
     */
    drawRoad(dataSourceId: string): void;

    /**
     * start the step of modifying a topography.
     * 地形編集する
     */
    editTopography(): void;

    /**
     * start the step of removing a topography.
     * 地形削除する
     */
    removeTopography(): void;

    editTopographyInfo(): void;

    loadContentsAPI(param: LoadContentsParam): Promise<LoadContentsResult>;

    showDetailDialog(param: {type: 'item' | 'content'; id: DataId}): void;

    registContentAPI(param: RegistContentParam): Promise<void>;

    updateContentAPI(param: UpdateContentParam): Promise<void>;

    linkContentToItemAPI(param: LinkContentToItemParam): Promise<void>;

    getSnsPreviewAPI(url: string): Promise<GetSnsPreviewResult>;

    getUnpointDataAPI(dataSourceId: string, nextToken?: string): Promise<GetUnpointDataResult>;

    /**
     * 指定のコンテンツのサムネイル画像（Blob）を取得する
     */
    getThumbnail(contentId: DataId): Promise<string>;

    changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean): void;

    /**
     * ユーザ一覧表示（管理者用コマンド）
     */
    showUserList(): void;
}

export type ServerInfo = {
    host: string;
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
    // コンテンツデータソース一覧
    dataSources: {
        dataSourceId: string;
        name: string;
    }[];
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
    getUnpointDataAPI: (dataSourceId: string, nextToken?: string) => Promise<GetUnpointDataResult>;
    // コンテンツ紐づけAPI
    linkContentToItemAPI: (param: LinkContentToItemParam) => Promise<void>;
}
