import { CSSProperties } from "react";
import { IconDefine, Auth, CategoryDefine, Condition, ContentsDefine, DatasourceGroup, EventDefine, GetUnpointContentsResult, MapDefine, MapKind, MutationLinkContentArgs, MutationRegistContentArgs, MutationUpdateContentArgs, SnsPreviewResult, GetItemsQuery, DatasourceInfo, ItemDefine, ThumbSize, SearchHitItem } from "../graphql/generated/graphql";
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

export type ItemType = {
    id: DataId;
    name: string;
    lastEditedTime: string;
    filterHit?: boolean;   // フィルタ時にフィルタ条件に該当した場合、true
    contents: {
        id: DataId
        filterHit?: boolean;   // フィルタ時にフィルタ条件に該当した場合、true
    }[];

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
     * @param target 選択状態になったアイテムのID。選択解除された場合、null。
     */
    onSelectChange?: (target: DataId | null) => void;

    /**
     * 地図上の建物orピンがクリックされた場合のコールバック
     * @param target 
     */
    onItemClick?: (target: DataId) => void;

    /**
     * 重なっているアイテムがクリックされた場合のコールバック。
     * このコールバックを指定している場合、重畳選択メニューは表示しない
     * @param targets 
     * @returns 
     */
    onClusterItemClick?: (targets: DataId[]) => void;

    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    /**
     * ロードされているアイテム情報に変更があった場合のコールバック
     * @param items ロードされている全アイテム情報
     * @returns 
     */
    onLoadedItemsChanged?: (items: ItemType[]) => void;
}

export interface TsunaguMapHandler {
    /**
     * switch the map kind
     * 表示する地図種別の切り替え。切り替え完了したら復帰。
     */
    switchMapKind(mapKind: MapKind): Promise<void>;

    /**
     * focus the item
     * 指定のアイテムにフォーカスする
     * @param itemId フォーカス対象のアイテムid
     * @param opts フォーカスする際のオプション
     *              zoom: trueの場合、フォーカスしたアイテムにズームする
     *              select: trueの場合、フォーカス後に対象アイテムを選択状態にする
     */
    focusItem(itemId: DataId, opts?: {zoom?: boolean, select?: boolean}): Promise<void>;

    /**
     * 全アイテムが表示される範囲にフィットさせる
     */
    fitAllItemsExtent(): void;

    /**
     * 指定の条件でフィルタする
     * @param condition フィルタ条件
     * @result フィルタ完了したら、true。条件に該当するものがない場合は、フィルタ実行せずfalseを返す。
     */
    filter(condition: Condition): Promise<boolean>;

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
     * @param refresh trueの場合、キャッシュを用いずに最新ロードする
     */
    loadContentImage(param: {contentId: DataId, size: ThumbSize, refresh?: boolean}): Promise<string>;

    /**
     * アイテム情報を更新する
     * @param itemId 対象アイテムID
     * @param param 更新する情報
     * @param opt オプション
     *          backend: trueの場合、裏で非同期で実行し、処理失敗した場合には地図上にエラーメッセージとリトライボタンが表示される
     */
    updateItem(itemId: DataId,
        param: {
            name?: string;
        },
        opt?: {
            backend?: boolean;
        }
    ): Promise<void>,

    /**
     * コンテンツを新規登録する
     */
    registContent(param: {
        datasourceId: string,
        parent: {
            type: 'item' | 'content',
            id: DataId,
        },
        title: string,
        overview: string;
        categories: string[],
        date?: string;
        imageUrl?: string;
        url?: string;
    }): Promise<void>;

    /**
     * コンテンツを更新する
     */
    updateContent(param: {
        id: DataId,
        title?: string,
        overview?: string;
        categories?: string[],
        date?: string;
        url?: string;
        imageUrl?: string;
        deleteImage?: boolean;
    }): Promise<void>;

    /**
     * コンテンツを削除する
     */
    removeContent(param: {
        id: DataId,
    }): Promise<void>;

    /**
     * 指定のコンテンツを指定のアイテムまたはコンテンツに子供として紐づける
     * @param param 
     */
    linkContent(param: {
        id: DataId;
        parent: {
            type: 'item' | 'content';
            id: DataId;
        }
    }): Promise<void>;

    /**
     * 指定のコンテンツについて、指定のアイテムまたはコンテンツとの紐づけを解除する
     * @param param 
     */
    unlinkContent(param: {
        id: DataId;
        parent: {
            type: 'item' | 'content';
            id: DataId;
        }
    }): Promise<void>;

    getSnsPreviewAPI(url: string): Promise<SnsPreviewResult>;

    getUnpointDataAPI(dataSourceId: string, nextToken?: string): Promise<GetUnpointContentsResult>;

    changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean): void;

    /**
     * 地図上の指定のアイテムを選択状態にする
     * @param id 選択状態にするアイテム。nullの場合、選択状態解除する
     */
    selectItem(id: DataId|null): void;

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

export type ItemInfo = Required<OperationResult<GetItemsQuery>>['data']['getItems'][0] & {
    temporary?: 'registing' | 'updating';
};
