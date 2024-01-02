export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** GeoJSON.Feature */
  GeoJsonFeature: { input: any; output: any; }
};

export enum Auth {
  Admin = 'Admin',
  Edit = 'Edit',
  None = 'None',
  Request = 'Request',
  View = 'View'
}

/** 円の場合のプロパティ（Earth, Forest, Area） */
export type CircleProperties = {
  featureType: FeatureType;
  /** 半径 */
  radius: Scalars['Float']['output'];
};

export type ContentConfig = {
  deletable: Scalars['Boolean']['output'];
  /** trueの場合、当該コンテンツデータソースを地図から外すこと不可 */
  disableUnlinkMap?: Maybe<Scalars['Boolean']['output']>;
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  /** 子コンテンツの追加が可能かどうか */
  linkableChildContents: Scalars['Boolean']['output'];
};

export type DataId = {
  dataSourceId: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

export type DataIdInput = {
  dataSourceId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};

export type DatasourceConfig = ContentConfig | ItemConfig | RealPointContentConfig | TrackConfig;

export type DatasourceInfo = {
  config: DatasourceConfig;
  datasourceId: Scalars['String']['output'];
  kind: DatasourceKindType;
  name: Scalars['String']['output'];
  visible: Scalars['Boolean']['output'];
};

export enum DatasourceKindType {
  Content = 'Content',
  Item = 'Item',
  RealPointContent = 'RealPointContent',
  Track = 'Track'
}

export enum ErrorType {
  /** ユーザのtokenが有効切れの場合 */
  Forbidden = 'Forbidden',
  /** その他接続エラー */
  IllegalError = 'IllegalError',
  /** アクセス権限のない地図にユーザがアクセスしようとした場合 */
  NoAuthenticate = 'NoAuthenticate',
  /** 編集権限を持たないユーザが編集権限の必要なAPIを実行しようとした場合 */
  OperationForbidden = 'OperationForbidden',
  /** アクセス権限のない地図に登録申請中の場合 */
  Requesting = 'Requesting',
  /** セッションタイムアウト時 */
  SessionTimeout = 'SessionTimeout',
  /** 地図が認証必要だが、ユーザがtokenを持たない場合（＝ログインが必要な場合） */
  Unauthorized = 'Unauthorized',
  /** 指定の地図が存在しない場合 */
  UndefinedMap = 'UndefinedMap'
}

/** 地物種別 */
export enum FeatureType {
  Area = 'AREA',
  Earth = 'EARTH',
  Forest = 'FOREST',
  Road = 'ROAD',
  Structure = 'STRUCTURE',
  Track = 'TRACK'
}

export type GeoProperties = CircleProperties | GeocoderFeatureProperties | RoadProperties | StructurePropeties | TrackPropeties;

/** OSM等で管理されているFeatureの場合のプロパティ（Area） */
export type GeocoderFeatureProperties = {
  featureType: FeatureType;
  geocoderIdInfo: GeocoderIdInfo;
};

/** OSM等で管理されているFeatureを特定する情報 */
export type GeocoderIdInfo = GeocoderIdMapbox | GeocoderIdOsm;

export type GeocoderIdInput = {
  /** Mapboxの場合 */
  id?: InputMaybe<Scalars['String']['input']>;
  map: OsmKind;
  osm_id?: InputMaybe<Scalars['Int']['input']>;
  /** OSMの場合 */
  osm_type?: InputMaybe<Scalars['String']['input']>;
};

/** Mapboxで管理されているFeatureを特定する情報 */
export type GeocoderIdMapbox = {
  id: Scalars['String']['output'];
};

/** OSMで管理されているFeatureを特定する情報 */
export type GeocoderIdOsm = {
  osm_id: Scalars['Int']['output'];
  osm_type: Scalars['String']['output'];
};

export type IconKey = {
  id: Scalars['String']['output'];
  type: IconType;
};

export enum IconType {
  Original = 'original',
  System = 'system'
}

export type ItemConfig = {
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
};

export enum ItemLabelMode {
  Hidden = 'hidden',
  Show = 'show'
}

export type MapDefine = {
  defaultMapKind: MapKind;
  name: Scalars['String']['output'];
  options: MapPageOptions;
  useMaps: Array<MapKind>;
};

export enum MapKind {
  Real = 'Real',
  Virtual = 'Virtual'
}

export type MapPageOptions = {
  /** ゲストユーザの操作権限 */
  guestUserAuthLevel: Auth;
  itemLabel?: Maybe<ItemLabelMode>;
  /** 新規登録ユーザに設定する権限 */
  newUserAuthLevel: Auth;
  /** その他オプション文字列 */
  options?: Maybe<Array<Scalars['String']['output']>>;
  popupMode?: Maybe<PopupMode>;
  /** 使用パネル */
  usePanels?: Maybe<Array<Scalars['String']['output']>>;
  /** 初期表示するデータソースを絞る場合に指定する */
  visibleDataSources: Array<VisibleDataSource>;
};

export enum OsmKind {
  Mapbox = 'mapbox',
  Osm = 'osm'
}

export enum PopupMode {
  Hidden = 'hidden',
  Maximum = 'maximum',
  Minimum = 'minimum'
}

export type RealPointContentConfig = {
  defaultIcon?: Maybe<IconKey>;
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
  linkableContents: Scalars['Boolean']['output'];
};

export type RoadProperties = {
  featureType: FeatureType;
  /** 元のline */
  lineJson: Scalars['GeoJsonFeature']['output'];
  /** RoadWidth.key */
  width: Scalars['String']['output'];
};

export type StructurePropeties = {
  featureType: FeatureType;
  icon?: Maybe<IconKey>;
};

export type TrackConfig = {
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
};

export type TrackPropeties = {
  featureType: FeatureType;
  maxZoom: Scalars['Float']['output'];
  minZoom: Scalars['Float']['output'];
};

export type User = {
  authLv: Auth;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type VisibleDataSource = VisibleDataSourceDatasource | VisibleDataSourceGroup;

export type VisibleDataSourceDatasource = {
  dataSourceId?: Maybe<Scalars['String']['output']>;
};

export type VisibleDataSourceGroup = {
  group?: Maybe<Scalars['String']['output']>;
};
