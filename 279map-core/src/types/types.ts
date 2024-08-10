import { Auth, CategoryDefine, ContentsDefine, ItemDatasourceInfo, ContentDatasourceInfo, EventDefine, MapDefine, GetItemsQuery, ThumbSize, CategoryCondition } from "../graphql/generated/graphql";
import { ChangeVisibleLayerTarget } from "../store/datasource/useDataSource";
import { IconDefine, MapKind, DataId, FeatureType, GeoProperties, IconKey, ContentValueMapForDB } from "../types-common/common-types";
import { OperationResult } from "urql";

/**
 * 現在の地図で使用可能なアイコン定義
 */
export type SystemIconDefine = Omit<IconDefine, 'useMaps'> & {
    type: IconKey['type'];
    originalSvgData?: string;
}

export type OnConnectParam = {
    authLv: Auth;
    userName: string | undefined;
    mapDefine: Omit<MapDefine, '__typename' | 'originalIcons'>;
};
export type OnConnectResult = {
    /**
     * 初期表示する地図種別。
     * 未指定時は地図に指定されているデフォルト地図種別（mapDefine.defaultMapKind（が適用される
     */
    mapKind?: MapKind;
}

export type OnMapLoadParam = {
    mapKind: MapKind;
    // 使用可能なアイコン
    icons: SystemIconDefine[];
    // 当該地図で使用可能なデータソース一覧
    itemDatasources: ItemDatasourceInfo[];
    contentDatasources: ContentDatasourceInfo[];
}

// 任意で指定するOnMapLoadの復帰値
export type OnMapLoadResult = {
    /**
     * 初期のアイテムレイヤの表示状態。
     * 未指定時は地図い指定されているデフォルト表示状態が適用される
     */
    initialItemLayerVisibles?: {
        datasourceId: string;
        visible: boolean;
    }[];
}

export type ItemType = {
    id: DataId;
    datasourceId: string;
    name: string;
    geoInfo: ItemGeoInfo;
    lastEditedTime: string;
    filterHit?: boolean;   // フィルタ時にフィルタ条件に該当した場合、true
    content?: {
        id: DataId;
        datasourceId: string;
        usingOtherMap: boolean;
        filterHit?: boolean;   // フィルタ時にフィルタ条件に該当した場合、true
    };
    linkedContents: {
        id: DataId
        datasourceId: string;
        filterHit?: boolean;   // フィルタ時にフィルタ条件に該当した場合、true
    }[];

}

export type DatasourceVisible = {
    type: 'datasource';
    datasourceId: string;
    visible: boolean;
}
export type DatasourceVisibleGroup = {
    type: 'group';
    groupName: string;
    visible: boolean;
    datasources: DatasourceVisible[];
}
export type ItemDatasourceVisibleList = (DatasourceVisibleGroup|DatasourceVisible)[];

export type ItemGeoInfo = {
    geometry: GeoJSON.Geometry;
    geoProperties: GeoProperties;
}
export type OverrideItem = ({
    type: 'new';
    datasourceId: string;
    /** 仮ID。focusItem等を行う時に、このidを指定する。 */
    tempId: DataId;
    name: string;
} & ItemGeoInfo)
| ({
    type: 'update';
    id: DataId;
    name?: string;
} & Partial<ItemGeoInfo>)
| {
    type: 'delete';
    id: DataId;
}

// Dataを特定するキー
type DataKey = {
    type: 'originalId';
    originalId: string;
} | {
    type: 'dataId';
    dataId: DataId;
}
export type TsunaguMapProps = {
    mapId: string;
    mapServer: {
        host: string;
        ssl: boolean;   // SSL通信の場合、true
        token?: string;
    };

    /** 未指定の場合は、coreで用意されているアイコンを用いる */
    iconDefine?: {
        defines: Omit<IconDefine, 'type'>[];
        /** 建物やピンに設定するアイコンID */
        defaultIconId: {
            virtual?: string;
            real?: string;
        }
    };

    /**
     * ポップアップ表示モード
     * - hidden: ポップアップ表示しない
     * - minimum: 小さなポップアップを表示する
     * - maximum: 大きいポップアップ（画像表示）を表示する（デフォルト）
     */
    popupMode?: 'hidden' | 'minimum' | 'maximum';
    disabledLabel?: boolean; // when true, the item's label hidden.

    /**
     * フィルタ時にフィルタ対象外の建物やピンをどう表示するか
     * hidden => 非表示
     * translucent => 半透明 default
     */
    filterUnmatchView?: 'hidden' | 'translucent';

    /**
     * アイテムを上書き表示する
     */
    overrideItems?: OverrideItem[];

    onConnect?: (param: OnConnectParam) => Promise<void | OnConnectResult>;
    onMapLoad?: (param: OnMapLoadParam) => Promise<void | OnMapLoadResult>;
    onItemDatasourcesVisibleChanged?: (param: ItemDatasourceVisibleList) => void;

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
     * 表示されているアイテム情報に変更があった場合のコールバック
     * @param items 表示中の全アイテム情報（フィルタ時のフィルタ対象外のアイテムは含まれる）
     * @returns 
     */
    onShowingItemsChanged?: (items: ItemType[]) => void;
}

export type LoadContentsResult = {
    content: ContentsDefine;
    unsubscribe?: () => void;   // callbackを渡した場合に格納されている
}

export interface TsunaguMapHandler {
    getInstanceId(): string;

    /**
     * switch the map kind
     * 表示する地図種別の切り替え。切り替え完了したら復帰。
     */
    switchMapKind(mapKind: MapKind): Promise<void>;

    /**
     * focus the item
     * 指定のアイテムにフォーカスする
     * @param itemId フォーカス対象のアイテムid
     * @param zoom trueの場合、フォーカスしたアイテムにズームする
     * @param select trueの場合、フォーカス後に対象アイテムを選択状態にする
     */
    focusItem(param: {
        itemId: DataId;
        zoom?: boolean;
        select?: boolean;
    }): Promise<void>;

    /**
     * 全アイテムが表示される範囲にフィットさせる
     */
    fitAllItemsExtent(): void;

    /**
     * 背景画像を切り替える
     * @param value 
     */
    switchBackground(value: 'osm' | 'japan' | 'japan-photo'): void;

    /**
     * 指定の条件でフィルタする
     * @param condition フィルタ条件
     * @result フィルタ完了したら、true。条件に該当するものがない場合は、フィルタ実行せずfalseを返す。
     */
    filter(condition: {
        category?: CategoryCondition[];
        date?: string[];
        keyword?: string[];
    }): Promise<boolean>;

    /**
     * フィルタ解除する
     */
    clearFilter(): void;

    /**
     * ユーザにアイテム描画してもらい、描画されたジオメトリを登録する。
     * @param featureType 表示中の地図種別に合わないものを指定した場合は何も実施しない
     * @return 登録したアイテムのDataId。ユーザによりキャンセルされた場合は、false
     */
    drawAndRegistItem(param: {
        featureType: FeatureType.STRUCTURE;
        datasourceId: string;
        /**
         * アイコンを指定可能なデータソースの場合、このfunctionが呼び出され、
         * 戻り値で返されたアイコンが描画に用いられる
         * @param icons 地図で使用可能なアイコン一覧
         * @returns 描画に用いるアイコン. 'cancel'の場合、後続処理中断。
         */
        iconFunction?: (icons: SystemIconDefine[]) => Promise<IconKey|'cancel'>;
    } | {
        featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA | FeatureType.ROAD;
        datasourceId: string;
    }): Promise<DataId|false>;

    /**
     * ユーザにアイテム描画してもらい、描画されたジオメトリを返す。
     * @param featureType 表示中の地図種別に合わないものを指定した場合は何も実施しない
     * @return 一時描画したジオメトリ。ユーザによりキャンセルされた場合は、null
     */
    drawTemporaryFeature(param: {
        featureType: FeatureType.STRUCTURE;
        datasourceId: string;
        /**
         * アイコンを指定可能なデータソースの場合、このfunctionが呼び出され、
         * 戻り値で返されたアイコンが描画に用いられる
         * @param icons 地図で使用可能なアイコン一覧
         * @returns 描画に用いるアイコン. 'cancel'の場合、後続処理中断。
         */
        iconFunction?: (icons: SystemIconDefine[]) => Promise<IconKey|'cancel'>;
    } | {
        featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA | FeatureType.ROAD;
        datasourceId: string;
    }): Promise<ItemGeoInfo|null>;

    /**
     * 指定の値でデータ登録する.
     * @param geo 図形 
     * @param values コンテンツデータ
     */
    registData(param: {
        datasourceId: string,
        item?: {
            geo: ItemGeoInfo,
        },
        contents?: {
            values: ContentValueMapForDB,
        }
        // 指定した場合は、指定先のparentの子として紐づける
        parent?: DataId,
    }): Promise<DataId>;
    
    /**
     * 指定の値でデータ更新する.
     * @param key 更新対象データ。originalId指定時は、キャッシュDBに未登録時にはキャッシュDBに新規登録される。
     * @param geo 図形 
     * @param values コンテンツデータ
     */
    updateData(param: {
        key: DataKey,
        item?: {
            geo: ItemGeoInfo | null,    // nullの場合、位置情報を削除する
        },
        contents?: {
            values: ContentValueMapForDB,
        }
    }): Promise<void>;

    /**
     * 指定のデータを削除する
     * @param id 
     */
    removeData(id: DataId): Promise<void>;

    /**
     * start the step of moving a structure (or a pin).
     * 移築または地点移動する
     */
    moveItem(): void;

    /**
     * start the step of modifying a topography or changing a structure's icon.
     * アイテム編集する。
     * 対象が土地の場合 -> 形変更
     * 対象がピンor建物の場合 -> 建物変更
     * @param targets 編集可能対象
     */
    editItem(param: {
        targets: FeatureType[]
        /**
         * 編集対象としてFeatureType.STRUCTUREが指定され、
         * かつ、アイコンを指定可能なデータソースの場合、このfunctionが呼び出され、
         * 戻り値で返されたアイコンが描画に用いられる
         * @param icons 地図で使用可能なアイコン一覧
         * @returns 描画に用いるアイコン. 'cancel'の場合、後続処理中断。
         */
        iconFunction?: (icons: SystemIconDefine[]) => Promise<IconKey|'cancel'>;
    }): Promise<void>;

    /**
     * start the step of removing an item.
     * ユーザにアイテム（建物、地形）を選択させて、データを削除する
     * @param targets 削除可能対象
     */
    removeDataByUser(targets: FeatureType[]): Promise<void>;

    /**
     * 指定のDataIdに属するコンテンツを取得する
     * @param dataId 
     * @return 指定のDataIdに属するコンテンツ. 属するコンテンツが存在しない場合は、nul
     */
    loadContent(dataId: DataId, changeListener?: (contentId: DataId, operation: 'update' | 'delete') => void): Promise<LoadContentsResult | null>;

    /**
     * 指定の画像データ(Base64)を取得する
     * @param imageId
     * @param size 取得サイズ
     * @param refresh trueの場合、キャッシュを用いずに最新ロードする
     */
    loadImage(param: {imageId: number, size: ThumbSize, refresh?: boolean}): Promise<string>;

    /**
     * 指定のコンテンツを指定のアイテムまたはコンテンツに子供として紐づける
     * @param param 
     */
    linkContent(param: {
        parent: DataId;
        child: {
            type: 'originalId';
            originalId: string;
        } | {
            type: 'dataId';
            dataId: DataId;
        }
    }): Promise<void>;

    /**
     * 指定のコンテンツについて、指定のアイテムまたはコンテンツとの紐づけを解除する
     * @param param 
     */
    unlinkContent(param: {
        id: DataId;
        parent: DataId;
    }): Promise<void>;

    getUnpointDataAPI(param: {
        datasourceId: string;
        nextToken?: string;
        keyword?: string
    }): Promise<{
        contents: {
            id: {
                // まだ地図に未登録のデータの場合
                type: 'originalId';
                originalId: string,
            } | {
                // 地図のどこかに登録済みのデータの場合
                type: 'dataId';
                dataId: DataId;
            };
            title: string;
            overview?: string;
            hasImage?: boolean;
        }[];
        nextToken?: string;
    }>;

    changeVisibleLayer(targets: ChangeVisibleLayerTarget[]): void;

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

export type NewContentInfoParam = {
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
    mode: 'manual' | 'select-unpoint';
}

export type ItemInfo = Omit<Required<OperationResult<GetItemsQuery>>['data']['getItems'][0], '__typename'> & {
    datasourceId: string;
    /**
     * DB未登録状態の場合に値設定
     * - temporary 呼び出し元から渡された値で一時描画したもの
     * - registing 新規登録処理中
     * - updating 更新処理中
     */
    temporary?: 'registing' | 'updating';
};
