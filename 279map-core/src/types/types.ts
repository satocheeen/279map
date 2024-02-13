import { CSSProperties } from "react";
import { IconDefine, Auth, CategoryDefine, Condition, ContentsDefine, DatasourceGroup, EventDefine, GetUnpointContentsResult, MapDefine, MapKind, MutationLinkContentArgs, MutationRegistContentArgs, MutationUpdateContentArgs, SnsPreviewResult, GetItemsQuery, DatasourceInfo, ItemDefine, ThumbSize, SearchHitItem } from "../graphql/generated/graphql";
import { ContentAttr } from "../components/contents/types";
import { DataId, FeatureType, GeoProperties, IconKey } from "../types-common/common-types";
import { OperationResult } from "urql";

export type OnMapLoadParam = {
    mapKind: MapKind;
    // 当該地図で使用可能なデータソース一覧
    itemDatasourceGroups: DatasourceGroup[];
    contentDataSources: DatasourceInfo[];
}
export type onDatasourceChangedParam = {
    datasourceGroups: DatasourceGroup[];
}
export type OnConnectParam = {
    authLv: Auth;
    userName: string | undefined;
    mapDefine: MapDefine;
};

export type ItemContent = {
    itemId: DataId;
    contents: DataId[];
}

export type ItemType = Pick<ItemDefine, 'id' | 'name' | 'lastEditedTime'>;

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

    /**
     * フィルタ時にフィルタ対象外の建物やピンをどう表示するか
     * hidden => 非表示
     * translucent => 半透明 default
     */
    filterUnmatchView?: 'hidden' | 'translucent';
    
    onConnect?: (param: OnConnectParam) => void;
    onMapLoad?: (param: OnMapLoadParam) => void;
    onDatasourceChanged?: (param: onDatasourceChangedParam) => void;

    /**
     * 地図上で建物orピンの選択状態が変更された場合のコールバック
     * @param target null
     */
    onSelectChange?: (target: ItemType | null) => void;

    onClick?: (targets: DataId[]) => void; // callback when an items are clicked.  if set this callback, cluster menu don't be shown.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.
    onVisibleItemsChanged?: (items: ItemContent[]) => void;

    // callback when kick the action to create a new content
    onAddNewContent?: (param: AddNewContentParam) => void;
    // callback when kick the action to edit a content
    onEditContent?: (param: EditContentParam) => void;
    // callback when kick the action to link a content with an item or a content
    onLinkUnpointedContent?: (param: LinkUnpointContentParam) => void;
}

export type FilterHitItem = Omit<SearchHitItem, '__typename'>;

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
     * 全アイテムが表示される範囲にフィットさせる
     */
    fitAllItemsExtent(): void;

    /**
     * 指定の条件でフィルタする
     * @param condition フィルタ条件
     */
    filter(condition: Condition): Promise<FilterHitItem[]>;
    /**
     * フィルタ解除する
     */
    clearFilter(): void;

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

    /**
     * 指定のアイテム配下のコンテンツを取得する
     * @param itemId 
     */
    loadContentsInItem(itemId: DataId): Promise<ContentsDefine[]>;

    loadContents(contentIds: DataId[]): Promise<ContentsDefine[]>;

    /**
     * 指定のコンテンツの画像データ(Base64)を取得する
     * @param contentId
     * @param size 取得サイズ
     */
    loadContentImage(param: {contentId: DataId, size: ThumbSize}): Promise<string>;

    showDetailDialog(param: {type: 'item' | 'content'; id: DataId}): void;

    registContent(param: MutationRegistContentArgs): Promise<void>;

    updateContent(param: MutationUpdateContentArgs): Promise<void>;

    /**
     * 指定のコンテンツを指定のアイテムまたはコンテンツに子供として紐づける
     * @param param 
     */
    linkContentToItemAPI(param: {
        id: DataId;
        parent: {
            type: 'item' | 'content';
            id: DataId;
        }
    }): Promise<void>;

    getSnsPreviewAPI(url: string): Promise<SnsPreviewResult>;

    getUnpointDataAPI(dataSourceId: string, nextToken?: string): Promise<GetUnpointContentsResult>;

    /**
     * 指定のコンテンツのサムネイル画像（Blob）を取得する
     */
    getThumbnail(contentId: DataId): Promise<string>;

    changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean): void;

    /**
     * 地図上の指定のアイテムを選択状態にする
     * @param id 
     */
    selectItem(id: DataId): void;

    /**
     * ユーザに地図上からアイテムを選択させる
     * @param targets 指定している場合、指定されているFeatureTypeのアイテムのみ選択可能
     * @return 選択された地図アイテム。キャンセルされた場合は、undefined。
     */
    selectItemByUser(targets?: FeatureType[]): Promise<DataId|undefined>;

    /**
     * ユーザ一覧表示（管理者用コマンド）
     */
    showUserList(): void;

    /**
     * コンテンツ管理画面表示（管理者用コマンド）
     */
    showContentsSetting(): void;
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
    type: IconKey['type'],
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
    getSnsPreviewAPI: (url: string) => Promise<SnsPreviewResult>;
    registContent: (param: MutationRegistContentArgs) => Promise<void>;
}
/**
 * 地図上でコンテンツ編集が選択された場合のコールバック
 */
export type EditContentParam = {
    contentId: DataId;
    currentAttr: ContentAttr;
    getSnsPreviewAPI: (url: string) => Promise<SnsPreviewResult>;
    updateContent: (param: MutationUpdateContentArgs) => Promise<void>;
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
    getUnpointDataAPI: (dataSourceId: string, nextToken?: string) => Promise<GetUnpointContentsResult>;
    // コンテンツ紐づけAPI
    linkContentToItemAPI: (param: MutationLinkContentArgs) => Promise<void>;
}

export type ItemInfo = Required<OperationResult<GetItemsQuery>>['data']['getItems'][0];
