import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Geometry } from 'geojson'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** GeoJSON.Feature */
  GeoJsonFeature: { input: any; output: any; }
  Geometry: { input: Geometry; output: Geometry; }
  JSON: { input: any; output: any; }
};

export enum Auth {
  Admin = 'Admin',
  Edit = 'Edit',
  None = 'None',
  Request = 'Request',
  View = 'View'
}

export type Auth0Config = {
  audience: Scalars['String']['output'];
  clientId: Scalars['String']['output'];
  domain: Scalars['String']['output'];
};

export type CategoryDefine = {
  color: Scalars['String']['output'];
  datasourceIds: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

/** 円の場合のプロパティ（Earth, Forest, Area） */
export type CircleProperties = {
  featureType: FeatureType;
  /** 半径 */
  radius: Scalars['Float']['output'];
};

export type Condition = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ConnectInfo = {
  authLv: Auth;
  sid: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type ConnectResult = {
  connect: ConnectInfo;
  mapDefine: MapDefine;
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

export enum ContentType {
  Normal = 'normal',
  Sns = 'sns'
}

export type ContentsDatasource = {
  datasourceId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ContentsDatasourceInput = {
  datasourceId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ContentsDefine = {
  anotherMapItemId?: Maybe<DataId>;
  category?: Maybe<Array<Scalars['String']['output']>>;
  children?: Maybe<Array<ContentsDefine>>;
  date?: Maybe<Scalars['String']['output']>;
  id: DataId;
  image: Scalars['Boolean']['output'];
  isDeletable: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  isSnsContent: Scalars['Boolean']['output'];
  itemId: DataId;
  overview?: Maybe<Scalars['String']['output']>;
  parentId?: Maybe<DataId>;
  title: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  usingAnotherMap: Scalars['Boolean']['output'];
  videoUrl?: Maybe<Scalars['String']['output']>;
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

export type DatasourceGroup = {
  datasources: Array<DatasourceInfo>;
  name?: Maybe<Scalars['String']['output']>;
  visible: Scalars['Boolean']['output'];
};

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

export type EventDefine = {
  datasourceId?: Maybe<Scalars['String']['output']>;
  dates: Array<Scalars['String']['output']>;
};

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
  info: GeocoderIdInfo;
  map: OsmKind;
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

export type GeocoderItem = {
  geoJson: Scalars['Geometry']['output'];
  idInfo: GeocoderIdInfo;
  name: Scalars['String']['output'];
};

export enum GeocoderTarget {
  Area = 'Area',
  Point = 'Point'
}

export type GetUnpointContentsResult = {
  contents: Array<UnpointContent>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type Hoge = {
  message: Scalars['String']['output'];
};

export type IconDefine = {
  caption?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imagePath: Scalars['String']['output'];
  useMaps: Array<MapKind>;
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

export type ItemDefine = {
  geoJson: Scalars['Geometry']['output'];
  geoProperties: GeoProperties;
  hasContents: Scalars['Boolean']['output'];
  hasImageContentId: Array<DataId>;
  id: DataId;
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
  temporary?: Maybe<ItemTemporaryState>;
};

export enum ItemLabelMode {
  Hidden = 'hidden',
  Show = 'show'
}

export enum ItemTemporaryState {
  Registing = 'Registing',
  Updateing = 'Updateing'
}

export type MapDefine = {
  defaultMapKind: MapKind;
  name: Scalars['String']['output'];
  options: MapPageOptions;
  useMaps: Array<MapKind>;
};

export type MapInfo = {
  contentDataSources: Array<DatasourceInfo>;
  extent: Array<Scalars['Float']['output']>;
  itemDataSourceGroups: Array<DatasourceGroup>;
  originalIcons: Array<IconDefine>;
};

export enum MapKind {
  Real = 'Real',
  Virtual = 'Virtual'
}

export type MapListItem = {
  mapId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

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

export type MediaInfo = {
  type: MediaType;
  url: Scalars['String']['output'];
};

export enum MediaType {
  Video = 'Video',
  Image = 'image'
}

export type Mutation = {
  changeAuthLevel?: Maybe<Scalars['Boolean']['output']>;
  connect: ConnectResult;
  disconnect?: Maybe<Scalars['Boolean']['output']>;
  linkContent?: Maybe<Scalars['Boolean']['output']>;
  linkContentsDatasource?: Maybe<Scalars['Boolean']['output']>;
  registContent?: Maybe<Scalars['Boolean']['output']>;
  registItem?: Maybe<Scalars['Boolean']['output']>;
  removeContent?: Maybe<Scalars['Boolean']['output']>;
  removeItem?: Maybe<Scalars['Boolean']['output']>;
  request?: Maybe<Scalars['Boolean']['output']>;
  switchMapKind: MapInfo;
  unlinkContent?: Maybe<Scalars['Boolean']['output']>;
  unlinkContentsDatasource?: Maybe<Scalars['Boolean']['output']>;
  updateContent?: Maybe<Scalars['Boolean']['output']>;
  updateItem?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationChangeAuthLevelArgs = {
  authLv: Auth;
  userId: Scalars['ID']['input'];
};


export type MutationConnectArgs = {
  mapId: Scalars['String']['input'];
};


export type MutationLinkContentArgs = {
  id: DataId;
  parent: ParentInput;
};


export type MutationLinkContentsDatasourceArgs = {
  contentsDatasources: Array<ContentsDatasourceInput>;
};


export type MutationRegistContentArgs = {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  datasourceId: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  parent: ParentInput;
  title: Scalars['String']['input'];
  type: ContentType;
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRegistItemArgs = {
  datasourceId: Scalars['String']['input'];
  geoProperties: GeoProperties;
  geometry: Scalars['Geometry']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveContentArgs = {
  id: DataId;
};


export type MutationRemoveItemArgs = {
  id: DataId;
};


export type MutationRequestArgs = {
  mapId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationSwitchMapKindArgs = {
  mapKind: MapKind;
};


export type MutationUnlinkContentArgs = {
  id: DataId;
  parent: ParentInput;
};


export type MutationUnlinkContentsDatasourceArgs = {
  contentsDatasourceIds: Array<Scalars['String']['input']>;
};


export type MutationUpdateContentArgs = {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Scalars['String']['input']>;
  id: DataId;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: ContentType;
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateItemArgs = {
  targets: Array<UpdateItemInput>;
};

export type NoneConfig = {
  dummy?: Maybe<Scalars['Boolean']['output']>;
};

export enum OsmKind {
  Mapbox = 'mapbox',
  Osm = 'osm'
}

export type ParentInput = {
  id: DataId;
  type: ParentOfContent;
};

export enum ParentOfContent {
  Content = 'Content',
  Item = 'Item'
}

export enum PopupMode {
  Hidden = 'hidden',
  Maximum = 'maximum',
  Minimum = 'minimum'
}

export type Query = {
  config: ServerConfig;
  geocoder: Array<GeocoderItem>;
  getCategory: Array<CategoryDefine>;
  getContent: ContentsDefine;
  getContents: Array<ContentsDefine>;
  getContentsInItem: Array<ContentsDefine>;
  getEvent: Array<EventDefine>;
  getGeocoderFeature: Scalars['Geometry']['output'];
  getImageUrl: Scalars['String']['output'];
  getItems: Array<ItemDefine>;
  getItemsById: Array<ItemDefine>;
  getLinkableContentsDatasources: Array<ContentsDatasource>;
  /** ユーザがアクセス可能な地図情報一覧を返す */
  getMapList: Array<MapListItem>;
  getSnsPreview: SnsPreviewResult;
  getThumb: Scalars['String']['output'];
  getUnpointContents: GetUnpointContentsResult;
  getUserList: Array<User>;
  search: Array<SearchHitItem>;
};


export type QueryGeocoderArgs = {
  address: Scalars['String']['input'];
  searchTarget: Array<GeocoderTarget>;
};


export type QueryGetCategoryArgs = {
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetContentArgs = {
  id: DataId;
};


export type QueryGetContentsArgs = {
  ids: Array<DataId>;
};


export type QueryGetContentsInItemArgs = {
  itemId: DataId;
};


export type QueryGetEventArgs = {
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetGeocoderFeatureArgs = {
  id: GeocoderIdInput;
};


export type QueryGetImageUrlArgs = {
  contentId: DataId;
};


export type QueryGetItemsArgs = {
  datasourceId: Scalars['String']['input'];
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']>>;
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
};


export type QueryGetItemsByIdArgs = {
  targets: Array<DataId>;
};


export type QueryGetSnsPreviewArgs = {
  url: Scalars['String']['input'];
};


export type QueryGetThumbArgs = {
  contentId: DataId;
  size?: InputMaybe<ThumbSize>;
};


export type QueryGetUnpointContentsArgs = {
  datasourceId: Scalars['String']['input'];
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchArgs = {
  condition: Condition;
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

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

export type SearchHitItem = {
  hitContents: Array<DataId>;
  id: DataId;
};

export type ServerConfig = Auth0Config | NoneConfig;

export type SnsPreviewPost = {
  date?: Maybe<Scalars['String']['output']>;
  media?: Maybe<MediaInfo>;
  text: Scalars['String']['output'];
};

export type SnsPreviewResult = {
  posts: Array<SnsPreviewPost>;
  type: SnsType;
};

export enum SnsType {
  InstagramUser = 'InstagramUser'
}

export type StructurePropeties = {
  featureType: FeatureType;
  icon?: Maybe<IconKey>;
};

export type Subscription = {
  /** 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合 */
  childContentsUpdate?: Maybe<Scalars['Boolean']['output']>;
  /** 地図上のアイテムが削除された場合に通知する */
  itemDelete: Array<DataId>;
  /** 地図上にアイテムが追加された場合に通知する */
  itemInsert: Array<Target>;
  /** 地図上のアイテムが更新された場合に通知する */
  itemUpdate: Array<Target>;
  /** 地図定義に変更があった場合 */
  mapInfoUpdate?: Maybe<Scalars['Boolean']['output']>;
  test: Hoge;
  /** ユーザ権限に更新があった場合 */
  updateUserAuth?: Maybe<Scalars['Boolean']['output']>;
  /** ユーザ一覧情報が更新された場合 */
  userListUpdate?: Maybe<Scalars['Boolean']['output']>;
};


export type SubscriptionChildContentsUpdateArgs = {
  itemId: DataId;
};


export type SubscriptionItemDeleteArgs = {
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
};


export type SubscriptionItemInsertArgs = {
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
};


export type SubscriptionItemUpdateArgs = {
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
};


export type SubscriptionMapInfoUpdateArgs = {
  mapId: Scalars['String']['input'];
};


export type SubscriptionUpdateUserAuthArgs = {
  mapId: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type SubscriptionUserListUpdateArgs = {
  mapId: Scalars['String']['input'];
};

export type Target = {
  /** 対象アイテムのID */
  id: DataId;
  /** アイテムの地図範囲。update時は更新後範囲 */
  wkt: Scalars['String']['output'];
};

export enum ThumbSize {
  Medium = 'Medium',
  Thumbnail = 'Thumbnail'
}

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

export type UnpointContent = {
  id: DataId;
  overview?: Maybe<Scalars['String']['output']>;
  thumb?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UpdateItemInput = {
  geoProperties?: InputMaybe<GeoProperties>;
  geometry?: InputMaybe<Scalars['Geometry']['input']>;
  id: DataId;
  name?: InputMaybe<Scalars['String']['input']>;
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<RefType extends Record<string, unknown>> = {
  DatasourceConfig: ( ContentConfig ) | ( ItemConfig ) | ( RealPointContentConfig ) | ( TrackConfig );
  GeoProperties: ( CircleProperties ) | ( Omit<GeocoderFeatureProperties, 'geocoderIdInfo'> & { geocoderIdInfo: RefType['GeocoderIdInfo'] } ) | ( RoadProperties ) | ( StructurePropeties ) | ( TrackPropeties );
  GeocoderIdInfo: ( GeocoderIdMapbox ) | ( GeocoderIdOsm );
  ServerConfig: ( Auth0Config ) | ( NoneConfig );
  VisibleDataSource: ( VisibleDataSourceDatasource ) | ( VisibleDataSourceGroup );
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Auth: Auth;
  Auth0Config: ResolverTypeWrapper<Auth0Config>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CategoryDefine: ResolverTypeWrapper<CategoryDefine>;
  CircleProperties: ResolverTypeWrapper<CircleProperties>;
  Condition: Condition;
  ConnectInfo: ResolverTypeWrapper<ConnectInfo>;
  ConnectResult: ResolverTypeWrapper<ConnectResult>;
  ContentConfig: ResolverTypeWrapper<ContentConfig>;
  ContentType: ContentType;
  ContentsDatasource: ResolverTypeWrapper<ContentsDatasource>;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ResolverTypeWrapper<ContentsDefine>;
  DataId: ResolverTypeWrapper<DataId>;
  DataIdInput: DataIdInput;
  DatasourceConfig: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['DatasourceConfig']>;
  DatasourceGroup: ResolverTypeWrapper<DatasourceGroup>;
  DatasourceInfo: ResolverTypeWrapper<Omit<DatasourceInfo, 'config'> & { config: ResolversTypes['DatasourceConfig'] }>;
  DatasourceKindType: DatasourceKindType;
  ErrorType: ErrorType;
  EventDefine: ResolverTypeWrapper<EventDefine>;
  FeatureType: FeatureType;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GeoJsonFeature: ResolverTypeWrapper<Scalars['GeoJsonFeature']['output']>;
  GeoProperties: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['GeoProperties']>;
  GeocoderFeatureProperties: ResolverTypeWrapper<Omit<GeocoderFeatureProperties, 'geocoderIdInfo'> & { geocoderIdInfo: ResolversTypes['GeocoderIdInfo'] }>;
  GeocoderIdInfo: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['GeocoderIdInfo']>;
  GeocoderIdInput: GeocoderIdInput;
  GeocoderIdMapbox: ResolverTypeWrapper<GeocoderIdMapbox>;
  GeocoderIdOsm: ResolverTypeWrapper<GeocoderIdOsm>;
  GeocoderItem: ResolverTypeWrapper<Omit<GeocoderItem, 'idInfo'> & { idInfo: ResolversTypes['GeocoderIdInfo'] }>;
  GeocoderTarget: GeocoderTarget;
  Geometry: ResolverTypeWrapper<Scalars['Geometry']['output']>;
  GetUnpointContentsResult: ResolverTypeWrapper<GetUnpointContentsResult>;
  Hoge: ResolverTypeWrapper<Hoge>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IconDefine: ResolverTypeWrapper<IconDefine>;
  IconKey: ResolverTypeWrapper<IconKey>;
  IconType: IconType;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  ItemConfig: ResolverTypeWrapper<ItemConfig>;
  ItemDefine: ResolverTypeWrapper<Omit<ItemDefine, 'geoProperties'> & { geoProperties: ResolversTypes['GeoProperties'] }>;
  ItemLabelMode: ItemLabelMode;
  ItemTemporaryState: ItemTemporaryState;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  MapDefine: ResolverTypeWrapper<MapDefine>;
  MapInfo: ResolverTypeWrapper<MapInfo>;
  MapKind: MapKind;
  MapListItem: ResolverTypeWrapper<MapListItem>;
  MapPageOptions: ResolverTypeWrapper<Omit<MapPageOptions, 'visibleDataSources'> & { visibleDataSources: Array<ResolversTypes['VisibleDataSource']> }>;
  MediaInfo: ResolverTypeWrapper<MediaInfo>;
  MediaType: MediaType;
  Mutation: ResolverTypeWrapper<{}>;
  NoneConfig: ResolverTypeWrapper<NoneConfig>;
  OsmKind: OsmKind;
  ParentInput: ParentInput;
  ParentOfContent: ParentOfContent;
  PopupMode: PopupMode;
  Query: ResolverTypeWrapper<{}>;
  RealPointContentConfig: ResolverTypeWrapper<RealPointContentConfig>;
  RoadProperties: ResolverTypeWrapper<RoadProperties>;
  SearchHitItem: ResolverTypeWrapper<SearchHitItem>;
  ServerConfig: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ServerConfig']>;
  SnsPreviewPost: ResolverTypeWrapper<SnsPreviewPost>;
  SnsPreviewResult: ResolverTypeWrapper<SnsPreviewResult>;
  SnsType: SnsType;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  StructurePropeties: ResolverTypeWrapper<StructurePropeties>;
  Subscription: ResolverTypeWrapper<{}>;
  Target: ResolverTypeWrapper<Target>;
  ThumbSize: ThumbSize;
  TrackConfig: ResolverTypeWrapper<TrackConfig>;
  TrackPropeties: ResolverTypeWrapper<TrackPropeties>;
  UnpointContent: ResolverTypeWrapper<UnpointContent>;
  UpdateItemInput: UpdateItemInput;
  User: ResolverTypeWrapper<User>;
  VisibleDataSource: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['VisibleDataSource']>;
  VisibleDataSourceDatasource: ResolverTypeWrapper<VisibleDataSourceDatasource>;
  VisibleDataSourceGroup: ResolverTypeWrapper<VisibleDataSourceGroup>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Auth0Config: Auth0Config;
  Boolean: Scalars['Boolean']['output'];
  CategoryDefine: CategoryDefine;
  CircleProperties: CircleProperties;
  Condition: Condition;
  ConnectInfo: ConnectInfo;
  ConnectResult: ConnectResult;
  ContentConfig: ContentConfig;
  ContentsDatasource: ContentsDatasource;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ContentsDefine;
  DataId: DataId;
  DataIdInput: DataIdInput;
  DatasourceConfig: ResolversUnionTypes<ResolversParentTypes>['DatasourceConfig'];
  DatasourceGroup: DatasourceGroup;
  DatasourceInfo: Omit<DatasourceInfo, 'config'> & { config: ResolversParentTypes['DatasourceConfig'] };
  EventDefine: EventDefine;
  Float: Scalars['Float']['output'];
  GeoJsonFeature: Scalars['GeoJsonFeature']['output'];
  GeoProperties: ResolversUnionTypes<ResolversParentTypes>['GeoProperties'];
  GeocoderFeatureProperties: Omit<GeocoderFeatureProperties, 'geocoderIdInfo'> & { geocoderIdInfo: ResolversParentTypes['GeocoderIdInfo'] };
  GeocoderIdInfo: ResolversUnionTypes<ResolversParentTypes>['GeocoderIdInfo'];
  GeocoderIdInput: GeocoderIdInput;
  GeocoderIdMapbox: GeocoderIdMapbox;
  GeocoderIdOsm: GeocoderIdOsm;
  GeocoderItem: Omit<GeocoderItem, 'idInfo'> & { idInfo: ResolversParentTypes['GeocoderIdInfo'] };
  Geometry: Scalars['Geometry']['output'];
  GetUnpointContentsResult: GetUnpointContentsResult;
  Hoge: Hoge;
  ID: Scalars['ID']['output'];
  IconDefine: IconDefine;
  IconKey: IconKey;
  Int: Scalars['Int']['output'];
  ItemConfig: ItemConfig;
  ItemDefine: Omit<ItemDefine, 'geoProperties'> & { geoProperties: ResolversParentTypes['GeoProperties'] };
  JSON: Scalars['JSON']['output'];
  MapDefine: MapDefine;
  MapInfo: MapInfo;
  MapListItem: MapListItem;
  MapPageOptions: Omit<MapPageOptions, 'visibleDataSources'> & { visibleDataSources: Array<ResolversParentTypes['VisibleDataSource']> };
  MediaInfo: MediaInfo;
  Mutation: {};
  NoneConfig: NoneConfig;
  ParentInput: ParentInput;
  Query: {};
  RealPointContentConfig: RealPointContentConfig;
  RoadProperties: RoadProperties;
  SearchHitItem: SearchHitItem;
  ServerConfig: ResolversUnionTypes<ResolversParentTypes>['ServerConfig'];
  SnsPreviewPost: SnsPreviewPost;
  SnsPreviewResult: SnsPreviewResult;
  String: Scalars['String']['output'];
  StructurePropeties: StructurePropeties;
  Subscription: {};
  Target: Target;
  TrackConfig: TrackConfig;
  TrackPropeties: TrackPropeties;
  UnpointContent: UnpointContent;
  UpdateItemInput: UpdateItemInput;
  User: User;
  VisibleDataSource: ResolversUnionTypes<ResolversParentTypes>['VisibleDataSource'];
  VisibleDataSourceDatasource: VisibleDataSourceDatasource;
  VisibleDataSourceGroup: VisibleDataSourceGroup;
};

export type Auth0ConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['Auth0Config'] = ResolversParentTypes['Auth0Config']> = {
  audience?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoryDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['CategoryDefine'] = ResolversParentTypes['CategoryDefine']> = {
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  datasourceIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CirclePropertiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['CircleProperties'] = ResolversParentTypes['CircleProperties']> = {
  featureType?: Resolver<ResolversTypes['FeatureType'], ParentType, ContextType>;
  radius?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectInfo'] = ResolversParentTypes['ConnectInfo']> = {
  authLv?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  sid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectResult'] = ResolversParentTypes['ConnectResult']> = {
  connect?: Resolver<ResolversTypes['ConnectInfo'], ParentType, ContextType>;
  mapDefine?: Resolver<ResolversTypes['MapDefine'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentConfig'] = ResolversParentTypes['ContentConfig']> = {
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  disableUnlinkMap?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  linkableChildContents?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentsDatasourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDatasource'] = ResolversParentTypes['ContentsDatasource']> = {
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentsDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDefine'] = ResolversParentTypes['ContentsDefine']> = {
  anotherMapItemId?: Resolver<Maybe<ResolversTypes['DataId']>, ParentType, ContextType>;
  category?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  children?: Resolver<Maybe<Array<ResolversTypes['ContentsDefine']>>, ParentType, ContextType>;
  date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isDeletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isEditable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSnsContent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  itemId?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  overview?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parentId?: Resolver<Maybe<ResolversTypes['DataId']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usingAnotherMap?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  videoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataIdResolvers<ContextType = any, ParentType extends ResolversParentTypes['DataId'] = ResolversParentTypes['DataId']> = {
  dataSourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DatasourceConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['DatasourceConfig'] = ResolversParentTypes['DatasourceConfig']> = {
  __resolveType: TypeResolveFn<'ContentConfig' | 'ItemConfig' | 'RealPointContentConfig' | 'TrackConfig', ParentType, ContextType>;
};

export type DatasourceGroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['DatasourceGroup'] = ResolversParentTypes['DatasourceGroup']> = {
  datasources?: Resolver<Array<ResolversTypes['DatasourceInfo']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  visible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DatasourceInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['DatasourceInfo'] = ResolversParentTypes['DatasourceInfo']> = {
  config?: Resolver<ResolversTypes['DatasourceConfig'], ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  visible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventDefine'] = ResolversParentTypes['EventDefine']> = {
  datasourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dates?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface GeoJsonFeatureScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['GeoJsonFeature'], any> {
  name: 'GeoJsonFeature';
}

export type GeoPropertiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeoProperties'] = ResolversParentTypes['GeoProperties']> = {
  __resolveType: TypeResolveFn<'CircleProperties' | 'GeocoderFeatureProperties' | 'RoadProperties' | 'StructurePropeties' | 'TrackPropeties', ParentType, ContextType>;
};

export type GeocoderFeaturePropertiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderFeatureProperties'] = ResolversParentTypes['GeocoderFeatureProperties']> = {
  featureType?: Resolver<ResolversTypes['FeatureType'], ParentType, ContextType>;
  geocoderIdInfo?: Resolver<ResolversTypes['GeocoderIdInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeocoderIdInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderIdInfo'] = ResolversParentTypes['GeocoderIdInfo']> = {
  __resolveType: TypeResolveFn<'GeocoderIdMapbox' | 'GeocoderIdOsm', ParentType, ContextType>;
};

export type GeocoderIdMapboxResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderIdMapbox'] = ResolversParentTypes['GeocoderIdMapbox']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeocoderIdOsmResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderIdOsm'] = ResolversParentTypes['GeocoderIdOsm']> = {
  osm_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  osm_type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeocoderItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderItem'] = ResolversParentTypes['GeocoderItem']> = {
  geoJson?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
  idInfo?: Resolver<ResolversTypes['GeocoderIdInfo'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface GeometryScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Geometry'], any> {
  name: 'Geometry';
}

export type GetUnpointContentsResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['GetUnpointContentsResult'] = ResolversParentTypes['GetUnpointContentsResult']> = {
  contents?: Resolver<Array<ResolversTypes['UnpointContent']>, ParentType, ContextType>;
  nextToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HogeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Hoge'] = ResolversParentTypes['Hoge']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IconDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['IconDefine'] = ResolversParentTypes['IconDefine']> = {
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  useMaps?: Resolver<Array<ResolversTypes['MapKind']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IconKeyResolvers<ContextType = any, ParentType extends ResolversParentTypes['IconKey'] = ResolversParentTypes['IconKey']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['IconType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemConfig'] = ResolversParentTypes['ItemConfig']> = {
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  layerGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemDefine'] = ResolversParentTypes['ItemDefine']> = {
  geoJson?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
  geoProperties?: Resolver<ResolversTypes['GeoProperties'], ParentType, ContextType>;
  hasContents?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasImageContentId?: Resolver<Array<ResolversTypes['DataId']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  lastEditedTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  temporary?: Resolver<Maybe<ResolversTypes['ItemTemporaryState']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MapDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapDefine'] = ResolversParentTypes['MapDefine']> = {
  defaultMapKind?: Resolver<ResolversTypes['MapKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  options?: Resolver<ResolversTypes['MapPageOptions'], ParentType, ContextType>;
  useMaps?: Resolver<Array<ResolversTypes['MapKind']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapInfo'] = ResolversParentTypes['MapInfo']> = {
  contentDataSources?: Resolver<Array<ResolversTypes['DatasourceInfo']>, ParentType, ContextType>;
  extent?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  itemDataSourceGroups?: Resolver<Array<ResolversTypes['DatasourceGroup']>, ParentType, ContextType>;
  originalIcons?: Resolver<Array<ResolversTypes['IconDefine']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapListItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapListItem'] = ResolversParentTypes['MapListItem']> = {
  mapId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapPageOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapPageOptions'] = ResolversParentTypes['MapPageOptions']> = {
  guestUserAuthLevel?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  itemLabel?: Resolver<Maybe<ResolversTypes['ItemLabelMode']>, ParentType, ContextType>;
  newUserAuthLevel?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  options?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  popupMode?: Resolver<Maybe<ResolversTypes['PopupMode']>, ParentType, ContextType>;
  usePanels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  visibleDataSources?: Resolver<Array<ResolversTypes['VisibleDataSource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaInfo'] = ResolversParentTypes['MediaInfo']> = {
  type?: Resolver<ResolversTypes['MediaType'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  changeAuthLevel?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationChangeAuthLevelArgs, 'authLv' | 'userId'>>;
  connect?: Resolver<ResolversTypes['ConnectResult'], ParentType, ContextType, RequireFields<MutationConnectArgs, 'mapId'>>;
  disconnect?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  linkContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkContentArgs, 'id' | 'parent'>>;
  linkContentsDatasource?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkContentsDatasourceArgs, 'contentsDatasources'>>;
  registContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRegistContentArgs, 'datasourceId' | 'parent' | 'title' | 'type'>>;
  registItem?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRegistItemArgs, 'datasourceId' | 'geoProperties' | 'geometry'>>;
  removeContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRemoveContentArgs, 'id'>>;
  removeItem?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRemoveItemArgs, 'id'>>;
  request?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRequestArgs, 'mapId' | 'name'>>;
  switchMapKind?: Resolver<ResolversTypes['MapInfo'], ParentType, ContextType, RequireFields<MutationSwitchMapKindArgs, 'mapKind'>>;
  unlinkContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUnlinkContentArgs, 'id' | 'parent'>>;
  unlinkContentsDatasource?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUnlinkContentsDatasourceArgs, 'contentsDatasourceIds'>>;
  updateContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUpdateContentArgs, 'id' | 'type'>>;
  updateItem?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUpdateItemArgs, 'targets'>>;
};

export type NoneConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['NoneConfig'] = ResolversParentTypes['NoneConfig']> = {
  dummy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  config?: Resolver<ResolversTypes['ServerConfig'], ParentType, ContextType>;
  geocoder?: Resolver<Array<ResolversTypes['GeocoderItem']>, ParentType, ContextType, RequireFields<QueryGeocoderArgs, 'address' | 'searchTarget'>>;
  getCategory?: Resolver<Array<ResolversTypes['CategoryDefine']>, ParentType, ContextType, Partial<QueryGetCategoryArgs>>;
  getContent?: Resolver<ResolversTypes['ContentsDefine'], ParentType, ContextType, RequireFields<QueryGetContentArgs, 'id'>>;
  getContents?: Resolver<Array<ResolversTypes['ContentsDefine']>, ParentType, ContextType, RequireFields<QueryGetContentsArgs, 'ids'>>;
  getContentsInItem?: Resolver<Array<ResolversTypes['ContentsDefine']>, ParentType, ContextType, RequireFields<QueryGetContentsInItemArgs, 'itemId'>>;
  getEvent?: Resolver<Array<ResolversTypes['EventDefine']>, ParentType, ContextType, Partial<QueryGetEventArgs>>;
  getGeocoderFeature?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType, RequireFields<QueryGetGeocoderFeatureArgs, 'id'>>;
  getImageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetImageUrlArgs, 'contentId'>>;
  getItems?: Resolver<Array<ResolversTypes['ItemDefine']>, ParentType, ContextType, RequireFields<QueryGetItemsArgs, 'datasourceId' | 'wkt' | 'zoom'>>;
  getItemsById?: Resolver<Array<ResolversTypes['ItemDefine']>, ParentType, ContextType, RequireFields<QueryGetItemsByIdArgs, 'targets'>>;
  getLinkableContentsDatasources?: Resolver<Array<ResolversTypes['ContentsDatasource']>, ParentType, ContextType>;
  getMapList?: Resolver<Array<ResolversTypes['MapListItem']>, ParentType, ContextType>;
  getSnsPreview?: Resolver<ResolversTypes['SnsPreviewResult'], ParentType, ContextType, RequireFields<QueryGetSnsPreviewArgs, 'url'>>;
  getThumb?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetThumbArgs, 'contentId'>>;
  getUnpointContents?: Resolver<ResolversTypes['GetUnpointContentsResult'], ParentType, ContextType, RequireFields<QueryGetUnpointContentsArgs, 'datasourceId'>>;
  getUserList?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  search?: Resolver<Array<ResolversTypes['SearchHitItem']>, ParentType, ContextType, RequireFields<QuerySearchArgs, 'condition'>>;
};

export type RealPointContentConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['RealPointContentConfig'] = ResolversParentTypes['RealPointContentConfig']> = {
  defaultIcon?: Resolver<Maybe<ResolversTypes['IconKey']>, ParentType, ContextType>;
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  layerGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  linkableContents?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RoadPropertiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoadProperties'] = ResolversParentTypes['RoadProperties']> = {
  featureType?: Resolver<ResolversTypes['FeatureType'], ParentType, ContextType>;
  lineJson?: Resolver<ResolversTypes['GeoJsonFeature'], ParentType, ContextType>;
  width?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SearchHitItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchHitItem'] = ResolversParentTypes['SearchHitItem']> = {
  hitContents?: Resolver<Array<ResolversTypes['DataId']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ServerConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ServerConfig'] = ResolversParentTypes['ServerConfig']> = {
  __resolveType: TypeResolveFn<'Auth0Config' | 'NoneConfig', ParentType, ContextType>;
};

export type SnsPreviewPostResolvers<ContextType = any, ParentType extends ResolversParentTypes['SnsPreviewPost'] = ResolversParentTypes['SnsPreviewPost']> = {
  date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  media?: Resolver<Maybe<ResolversTypes['MediaInfo']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SnsPreviewResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SnsPreviewResult'] = ResolversParentTypes['SnsPreviewResult']> = {
  posts?: Resolver<Array<ResolversTypes['SnsPreviewPost']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SnsType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StructurePropetiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['StructurePropeties'] = ResolversParentTypes['StructurePropeties']> = {
  featureType?: Resolver<ResolversTypes['FeatureType'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['IconKey']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  childContentsUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "childContentsUpdate", ParentType, ContextType, RequireFields<SubscriptionChildContentsUpdateArgs, 'itemId'>>;
  itemDelete?: SubscriptionResolver<Array<ResolversTypes['DataId']>, "itemDelete", ParentType, ContextType, RequireFields<SubscriptionItemDeleteArgs, 'mapId' | 'mapKind'>>;
  itemInsert?: SubscriptionResolver<Array<ResolversTypes['Target']>, "itemInsert", ParentType, ContextType, RequireFields<SubscriptionItemInsertArgs, 'mapId' | 'mapKind'>>;
  itemUpdate?: SubscriptionResolver<Array<ResolversTypes['Target']>, "itemUpdate", ParentType, ContextType, RequireFields<SubscriptionItemUpdateArgs, 'mapId' | 'mapKind'>>;
  mapInfoUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "mapInfoUpdate", ParentType, ContextType, RequireFields<SubscriptionMapInfoUpdateArgs, 'mapId'>>;
  test?: SubscriptionResolver<ResolversTypes['Hoge'], "test", ParentType, ContextType>;
  updateUserAuth?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "updateUserAuth", ParentType, ContextType, RequireFields<SubscriptionUpdateUserAuthArgs, 'mapId' | 'userId'>>;
  userListUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "userListUpdate", ParentType, ContextType, RequireFields<SubscriptionUserListUpdateArgs, 'mapId'>>;
};

export type TargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['Target'] = ResolversParentTypes['Target']> = {
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  wkt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrackConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackConfig'] = ResolversParentTypes['TrackConfig']> = {
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  layerGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrackPropetiesResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackPropeties'] = ResolversParentTypes['TrackPropeties']> = {
  featureType?: Resolver<ResolversTypes['FeatureType'], ParentType, ContextType>;
  maxZoom?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  minZoom?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnpointContentResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnpointContent'] = ResolversParentTypes['UnpointContent']> = {
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  overview?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  thumb?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  authLv?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VisibleDataSourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['VisibleDataSource'] = ResolversParentTypes['VisibleDataSource']> = {
  __resolveType: TypeResolveFn<'VisibleDataSourceDatasource' | 'VisibleDataSourceGroup', ParentType, ContextType>;
};

export type VisibleDataSourceDatasourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['VisibleDataSourceDatasource'] = ResolversParentTypes['VisibleDataSourceDatasource']> = {
  dataSourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VisibleDataSourceGroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['VisibleDataSourceGroup'] = ResolversParentTypes['VisibleDataSourceGroup']> = {
  group?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Auth0Config?: Auth0ConfigResolvers<ContextType>;
  CategoryDefine?: CategoryDefineResolvers<ContextType>;
  CircleProperties?: CirclePropertiesResolvers<ContextType>;
  ConnectInfo?: ConnectInfoResolvers<ContextType>;
  ConnectResult?: ConnectResultResolvers<ContextType>;
  ContentConfig?: ContentConfigResolvers<ContextType>;
  ContentsDatasource?: ContentsDatasourceResolvers<ContextType>;
  ContentsDefine?: ContentsDefineResolvers<ContextType>;
  DataId?: DataIdResolvers<ContextType>;
  DatasourceConfig?: DatasourceConfigResolvers<ContextType>;
  DatasourceGroup?: DatasourceGroupResolvers<ContextType>;
  DatasourceInfo?: DatasourceInfoResolvers<ContextType>;
  EventDefine?: EventDefineResolvers<ContextType>;
  GeoJsonFeature?: GraphQLScalarType;
  GeoProperties?: GeoPropertiesResolvers<ContextType>;
  GeocoderFeatureProperties?: GeocoderFeaturePropertiesResolvers<ContextType>;
  GeocoderIdInfo?: GeocoderIdInfoResolvers<ContextType>;
  GeocoderIdMapbox?: GeocoderIdMapboxResolvers<ContextType>;
  GeocoderIdOsm?: GeocoderIdOsmResolvers<ContextType>;
  GeocoderItem?: GeocoderItemResolvers<ContextType>;
  Geometry?: GraphQLScalarType;
  GetUnpointContentsResult?: GetUnpointContentsResultResolvers<ContextType>;
  Hoge?: HogeResolvers<ContextType>;
  IconDefine?: IconDefineResolvers<ContextType>;
  IconKey?: IconKeyResolvers<ContextType>;
  ItemConfig?: ItemConfigResolvers<ContextType>;
  ItemDefine?: ItemDefineResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  MapDefine?: MapDefineResolvers<ContextType>;
  MapInfo?: MapInfoResolvers<ContextType>;
  MapListItem?: MapListItemResolvers<ContextType>;
  MapPageOptions?: MapPageOptionsResolvers<ContextType>;
  MediaInfo?: MediaInfoResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NoneConfig?: NoneConfigResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RealPointContentConfig?: RealPointContentConfigResolvers<ContextType>;
  RoadProperties?: RoadPropertiesResolvers<ContextType>;
  SearchHitItem?: SearchHitItemResolvers<ContextType>;
  ServerConfig?: ServerConfigResolvers<ContextType>;
  SnsPreviewPost?: SnsPreviewPostResolvers<ContextType>;
  SnsPreviewResult?: SnsPreviewResultResolvers<ContextType>;
  StructurePropeties?: StructurePropetiesResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Target?: TargetResolvers<ContextType>;
  TrackConfig?: TrackConfigResolvers<ContextType>;
  TrackPropeties?: TrackPropetiesResolvers<ContextType>;
  UnpointContent?: UnpointContentResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  VisibleDataSource?: VisibleDataSourceResolvers<ContextType>;
  VisibleDataSourceDatasource?: VisibleDataSourceDatasourceResolvers<ContextType>;
  VisibleDataSourceGroup?: VisibleDataSourceGroupResolvers<ContextType>;
};

