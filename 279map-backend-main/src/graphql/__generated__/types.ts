import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Geometry } from 'geojson'
import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap, MapKind, IconDefine } from '../../types-common/common-types'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ContentDatasourceConfig: { input: ContentDatasourceConfig; output: ContentDatasourceConfig; }
  ContentValueMap: { input: ContentValueMap; output: ContentValueMap; }
  DataId: { input: DataId; output: DataId; }
  GeoProperties: { input: GeoProperties; output: GeoProperties; }
  GeocoderIdInfo: { input: GeocoderIdInfo; output: GeocoderIdInfo; }
  Geometry: { input: Geometry; output: Geometry; }
  IconDefine: { input: IconDefine; output: IconDefine; }
  IconKey: { input: IconKey; output: IconKey; }
  ItemDatasourceConfig: { input: ItemDatasourceConfig; output: ItemDatasourceConfig; }
  JSON: { input: any; output: any; }
  MapKind: { input: MapKind; output: MapKind; }
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

export type CategoryCondition = {
  /** 対象のコンテンツデータソースID */
  datasourceId: Scalars['String']['input'];
  /** 対象のフィールド */
  fieldKey: Scalars['String']['input'];
  /** カテゴリ値 */
  value: Scalars['String']['input'];
};

export type CategoryDefine = {
  /** 属するカテゴリ一覧 */
  categories: Array<CategoryItem>;
  /** 対象のコンテンツデータソースID */
  datasourceId: Scalars['String']['output'];
  /** 対象のフィールド */
  fieldKey: Scalars['String']['output'];
};

export type CategoryItem = {
  color: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Condition = {
  category?: InputMaybe<Array<CategoryCondition>>;
  date?: InputMaybe<Array<DateCondition>>;
  keyword?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum ConnectErrorType {
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

export type ContentDatasourceInfo = {
  config: Scalars['ContentDatasourceConfig']['output'];
  datasourceId: Scalars['String']['output'];
  name: Scalars['String']['output'];
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
  datasourceId: Scalars['String']['output'];
  hasImage: Scalars['Boolean']['output'];
  hasValue: Scalars['Boolean']['output'];
  id: Scalars['DataId']['output'];
  /** 紐づいているコンテンツのID一覧 */
  linkedContents: Array<ContentsDefine>;
};

export type ContentsDetail = {
  /** もう片方の地図で参照されている場合に、その参照元のID */
  anotherMapItemId?: Maybe<Scalars['DataId']['output']>;
  datasourceId: Scalars['String']['output'];
  id: Scalars['DataId']['output'];
  /** trueの場合、ユーザ権限に関わらずreadonly */
  readonly?: Maybe<Scalars['Boolean']['output']>;
  /** 他の地図でも参照されているか */
  usingOtherMap: Scalars['Boolean']['output'];
  /** 属性値 */
  values: Scalars['ContentValueMap']['output'];
};

export type DateCondition = {
  /** 日付文字列 */
  date: Scalars['String']['input'];
  /** クライアント端末のUTCからの時差 */
  utcOffset: Scalars['Int']['input'];
};

export type ErrorInfo = {
  /** エラー詳細 */
  description?: Maybe<Scalars['String']['output']>;
  /** 特定のアイテムに紐づくエラーの場合、アイテムID */
  itemId?: Maybe<Scalars['DataId']['output']>;
  /** エラー種別 */
  type: ErrorType;
};

export enum ErrorType {
  /** アイテム登録に失敗した場合 */
  RegistItemFailed = 'RegistItemFailed'
}

export type EventContent = {
  date: Scalars['String']['output'];
  id: Scalars['DataId']['output'];
};

export type EventDefine = {
  /** 日付を持つコンテンツ一覧 */
  contents: Array<EventContent>;
  itemDatasourceId: Scalars['String']['output'];
};

export type GeocoderItem = {
  geometry: Scalars['Geometry']['output'];
  idInfo: Scalars['GeocoderIdInfo']['output'];
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

export type ItemDatasourceInfo = {
  config: Scalars['ItemDatasourceConfig']['output'];
  datasourceId: Scalars['String']['output'];
  groupName?: Maybe<Scalars['String']['output']>;
  initialVisible: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type ItemDefine = {
  /** アイテムと対になるコンテンツ */
  content?: Maybe<ContentsDefine>;
  datasourceId: Scalars['String']['output'];
  geoProperties: Scalars['GeoProperties']['output'];
  geometry: Scalars['Geometry']['output'];
  id: Scalars['DataId']['output'];
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** アイテムラベル表示モード */
export enum ItemLabelMode {
  /** 表示しない */
  Hidden = 'hidden',
  /** 世界地図のみ表示 */
  RealShow = 'realShow',
  /** 表示する */
  Show = 'show',
  /** 村マップのみ表示 */
  VirtualShow = 'virtualShow'
}

export type MapDefine = {
  defaultMapKind: Scalars['MapKind']['output'];
  name: Scalars['String']['output'];
  options: MapPageOptions;
  originalIcons: Array<Scalars['IconDefine']['output']>;
  useMaps: Array<Scalars['MapKind']['output']>;
};

export type MapInfo = {
  contentDataSources: Array<ContentDatasourceInfo>;
  extent: Array<Scalars['Float']['output']>;
  itemDataSources: Array<ItemDatasourceInfo>;
};

export type MapListItem = {
  authLv: Auth;
  description?: Maybe<Scalars['String']['output']>;
  mapId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
};

/** 地図ページのメタ情報 */
export type MapMetaInfo = {
  description?: Maybe<Scalars['String']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  keyword?: Maybe<Scalars['String']['output']>;
  mapId: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type MapPageOptions = {
  /** コンテンツソート順 */
  contentsSortCondition?: Maybe<SortCondition>;
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
};

export type Mutation = {
  changeAuthLevel?: Maybe<Scalars['Boolean']['output']>;
  connect: ConnectResult;
  disconnect?: Maybe<Scalars['Boolean']['output']>;
  /** データをリンクする */
  linkData?: Maybe<Scalars['Boolean']['output']>;
  /** データをリンクする（オリジナルID指定版） */
  linkDataByOriginalId?: Maybe<Scalars['Boolean']['output']>;
  /** データ登録 */
  registData: Scalars['DataId']['output'];
  /** データ削除 */
  removeData: Scalars['Boolean']['output'];
  request?: Maybe<Scalars['Boolean']['output']>;
  switchMapKind: MapInfo;
  unlinkData?: Maybe<Scalars['Boolean']['output']>;
  /** データ更新 */
  updateData: Scalars['Boolean']['output'];
  /** データ更新（オリジナルID指定） */
  updateDataByOriginalId: Scalars['Boolean']['output'];
};


export type MutationChangeAuthLevelArgs = {
  authLv: Auth;
  userId: Scalars['ID']['input'];
};


export type MutationConnectArgs = {
  mapId: Scalars['String']['input'];
};


export type MutationLinkDataArgs = {
  id: Scalars['DataId']['input'];
  parent: Scalars['DataId']['input'];
};


export type MutationLinkDataByOriginalIdArgs = {
  originalId: Scalars['String']['input'];
  parent: Scalars['DataId']['input'];
};


export type MutationRegistDataArgs = {
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
  datasourceId: Scalars['String']['input'];
  item?: InputMaybe<RegistDataItemInput>;
  linkDatas?: InputMaybe<Array<Scalars['DataId']['input']>>;
};


export type MutationRemoveDataArgs = {
  id: Scalars['DataId']['input'];
};


export type MutationRequestArgs = {
  mapId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationSwitchMapKindArgs = {
  mapKind: Scalars['MapKind']['input'];
};


export type MutationUnlinkDataArgs = {
  id: Scalars['DataId']['input'];
  parent: Scalars['DataId']['input'];
};


export type MutationUpdateDataArgs = {
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
  deleteItem?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['DataId']['input'];
  item?: InputMaybe<RegistDataItemInput>;
};


export type MutationUpdateDataByOriginalIdArgs = {
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
  item?: InputMaybe<RegistDataItemInput>;
  originalId: Scalars['String']['input'];
};

export type NoneConfig = {
  dummy?: Maybe<Scalars['Boolean']['output']>;
};

export enum Operation {
  Delete = 'Delete',
  Update = 'Update'
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
  getContent: ContentsDetail;
  getEvent: Array<EventDefine>;
  getGeocoderFeature: Scalars['Geometry']['output'];
  /** 指定の画像を返す */
  getImage: Scalars['String']['output'];
  getImageUrl: Scalars['String']['output'];
  getItems: Array<ItemDefine>;
  getItemsById: Array<ItemDefine>;
  getLinkableContentsDatasources: Array<ContentsDatasource>;
  /** ユーザがアクセス可能な地図情報一覧を返す */
  getMapList: Array<MapListItem>;
  /** 地図のメタ情報を返す。ユーザがアクセス不可能な地図については、エラー */
  getMapMetaInfo: MapMetaInfo;
  /** 指定のコンテンツのサムネイル画像を返す */
  getThumb: Scalars['String']['output'];
  /** 未割当コンテンツを取得する */
  getUnpointContents: GetUnpointContentsResult;
  getUserList: Array<User>;
  /** 検索。検索にヒットしたもののデータIDを返す */
  search: Array<Scalars['DataId']['output']>;
};


export type QueryGeocoderArgs = {
  address: Scalars['String']['input'];
  searchTarget: Array<GeocoderTarget>;
};


export type QueryGetCategoryArgs = {
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetContentArgs = {
  id: Scalars['DataId']['input'];
};


export type QueryGetEventArgs = {
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetGeocoderFeatureArgs = {
  id: Scalars['GeocoderIdInfo']['input'];
};


export type QueryGetImageArgs = {
  imageId: Scalars['Int']['input'];
  size: ThumbSize;
};


export type QueryGetImageUrlArgs = {
  contentId: Scalars['DataId']['input'];
};


export type QueryGetItemsArgs = {
  datasourceId: Scalars['String']['input'];
  excludeItemIds?: InputMaybe<Array<Scalars['DataId']['input']>>;
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
};


export type QueryGetItemsByIdArgs = {
  targets: Array<Scalars['DataId']['input']>;
};


export type QueryGetMapMetaInfoArgs = {
  mapId: Scalars['String']['input'];
};


export type QueryGetThumbArgs = {
  contentId: Scalars['DataId']['input'];
};


export type QueryGetUnpointContentsArgs = {
  datasourceId: Scalars['String']['input'];
  keyword?: InputMaybe<Scalars['String']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchArgs = {
  condition: Condition;
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type RegistDataItemInput = {
  geoProperties: Scalars['GeoProperties']['input'];
  geometry: Scalars['Geometry']['input'];
};

export type ServerConfig = Auth0Config | NoneConfig;

export enum SortCondition {
  /** 作成日時昇順 */
  CreatedAtAsc = 'CreatedAtAsc',
  /** 作成日時降順 */
  CreatedAtDesc = 'CreatedAtDesc',
  /** 日時昇順 */
  DateAsc = 'DateAsc',
  /** 日時降順 */
  DateDesc = 'DateDesc',
  /** 更新日時昇順 */
  UpdatedAtAsc = 'UpdatedAtAsc',
  /** 更新日時降順 */
  UpdatedAtDesc = 'UpdatedAtDesc'
}

export type Subscription = {
  /** 指定の地図のカテゴリに変更があった場合に通知する */
  categoryUpdateInTheMap?: Maybe<Scalars['Boolean']['output']>;
  /** 指定の地図上のデータが削除された場合に通知する */
  dataDeleteInTheMap: Array<Scalars['DataId']['output']>;
  /** 指定の地図上にデータが追加された場合に通知する */
  dataInsertInTheMap: Array<Target>;
  /** 指定のデータが更新/削除された場合に通知する */
  dataUpdate: Operation;
  /** 指定の地図上のデータが更新された場合に通知する */
  dataUpdateInTheMap: Array<Target>;
  /**
   * ユーザが操作している地図でエラーが発生した場合にエラー内容を通知する。
   * 突き放し実行している登録、更新処理でエラー発生した場合に通知するために用意。
   */
  error: ErrorInfo;
  /** 地図定義に変更があった場合 */
  mapInfoUpdate?: Maybe<Scalars['Boolean']['output']>;
  /** ユーザ権限に更新があった場合 */
  updateUserAuth?: Maybe<Scalars['Boolean']['output']>;
  /** ユーザ一覧情報が更新された場合 */
  userListUpdate?: Maybe<Scalars['Boolean']['output']>;
};


export type SubscriptionCategoryUpdateInTheMapArgs = {
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
};


export type SubscriptionDataDeleteInTheMapArgs = {
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
};


export type SubscriptionDataInsertInTheMapArgs = {
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
};


export type SubscriptionDataUpdateArgs = {
  id: Scalars['DataId']['input'];
};


export type SubscriptionDataUpdateInTheMapArgs = {
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
};


export type SubscriptionErrorArgs = {
  sid: Scalars['String']['input'];
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
  /** 対象のデータソースID */
  datasourceId: Scalars['String']['output'];
  /** コンテンツ情報を持つデータの場合、true */
  hasContent: Scalars['Boolean']['output'];
  /** アイテム情報を持つデータの場合、true */
  hasItem: Scalars['Boolean']['output'];
  /** 対象のデータID */
  id: Scalars['DataId']['output'];
  /** アイテムを持つ場合、地図範囲。update時は更新後範囲 */
  wkt?: Maybe<Scalars['String']['output']>;
};

export enum ThumbSize {
  Medium = 'Medium',
  Thumbnail = 'Thumbnail'
}

export type UnpointContent = {
  /** DBに登録済みの場合は、dataIdも返す */
  dataId?: Maybe<Scalars['DataId']['output']>;
  hasImage?: Maybe<Scalars['Boolean']['output']>;
  originalId: Scalars['String']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UpdateItemInput = {
  geoProperties?: InputMaybe<Scalars['GeoProperties']['input']>;
  geometry?: InputMaybe<Scalars['Geometry']['input']>;
  id: Scalars['DataId']['input'];
};

export type UpdateItemsResult = {
  error?: Maybe<Array<Scalars['DataId']['output']>>;
  success: Array<Scalars['DataId']['output']>;
};

export type User = {
  authLv: Auth;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
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
  ServerConfig: ( Auth0Config ) | ( NoneConfig );
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Auth: Auth;
  Auth0Config: ResolverTypeWrapper<Auth0Config>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CategoryCondition: CategoryCondition;
  CategoryDefine: ResolverTypeWrapper<CategoryDefine>;
  CategoryItem: ResolverTypeWrapper<CategoryItem>;
  Condition: Condition;
  ConnectErrorType: ConnectErrorType;
  ConnectInfo: ResolverTypeWrapper<ConnectInfo>;
  ConnectResult: ResolverTypeWrapper<ConnectResult>;
  ContentDatasourceConfig: ResolverTypeWrapper<Scalars['ContentDatasourceConfig']['output']>;
  ContentDatasourceInfo: ResolverTypeWrapper<ContentDatasourceInfo>;
  ContentType: ContentType;
  ContentValueMap: ResolverTypeWrapper<Scalars['ContentValueMap']['output']>;
  ContentsDatasource: ResolverTypeWrapper<ContentsDatasource>;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ResolverTypeWrapper<ContentsDefine>;
  ContentsDetail: ResolverTypeWrapper<ContentsDetail>;
  DataId: ResolverTypeWrapper<Scalars['DataId']['output']>;
  DateCondition: DateCondition;
  ErrorInfo: ResolverTypeWrapper<ErrorInfo>;
  ErrorType: ErrorType;
  EventContent: ResolverTypeWrapper<EventContent>;
  EventDefine: ResolverTypeWrapper<EventDefine>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GeoProperties: ResolverTypeWrapper<Scalars['GeoProperties']['output']>;
  GeocoderIdInfo: ResolverTypeWrapper<Scalars['GeocoderIdInfo']['output']>;
  GeocoderItem: ResolverTypeWrapper<GeocoderItem>;
  GeocoderTarget: GeocoderTarget;
  Geometry: ResolverTypeWrapper<Scalars['Geometry']['output']>;
  GetUnpointContentsResult: ResolverTypeWrapper<GetUnpointContentsResult>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IconDefine: ResolverTypeWrapper<Scalars['IconDefine']['output']>;
  IconKey: ResolverTypeWrapper<Scalars['IconKey']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  ItemDatasourceConfig: ResolverTypeWrapper<Scalars['ItemDatasourceConfig']['output']>;
  ItemDatasourceInfo: ResolverTypeWrapper<ItemDatasourceInfo>;
  ItemDefine: ResolverTypeWrapper<ItemDefine>;
  ItemLabelMode: ItemLabelMode;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  MapDefine: ResolverTypeWrapper<MapDefine>;
  MapInfo: ResolverTypeWrapper<MapInfo>;
  MapKind: ResolverTypeWrapper<Scalars['MapKind']['output']>;
  MapListItem: ResolverTypeWrapper<MapListItem>;
  MapMetaInfo: ResolverTypeWrapper<MapMetaInfo>;
  MapPageOptions: ResolverTypeWrapper<MapPageOptions>;
  Mutation: ResolverTypeWrapper<{}>;
  NoneConfig: ResolverTypeWrapper<NoneConfig>;
  Operation: Operation;
  PopupMode: PopupMode;
  Query: ResolverTypeWrapper<{}>;
  RegistDataItemInput: RegistDataItemInput;
  ServerConfig: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ServerConfig']>;
  SortCondition: SortCondition;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Target: ResolverTypeWrapper<Target>;
  ThumbSize: ThumbSize;
  UnpointContent: ResolverTypeWrapper<UnpointContent>;
  UpdateItemInput: UpdateItemInput;
  UpdateItemsResult: ResolverTypeWrapper<UpdateItemsResult>;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Auth0Config: Auth0Config;
  Boolean: Scalars['Boolean']['output'];
  CategoryCondition: CategoryCondition;
  CategoryDefine: CategoryDefine;
  CategoryItem: CategoryItem;
  Condition: Condition;
  ConnectInfo: ConnectInfo;
  ConnectResult: ConnectResult;
  ContentDatasourceConfig: Scalars['ContentDatasourceConfig']['output'];
  ContentDatasourceInfo: ContentDatasourceInfo;
  ContentValueMap: Scalars['ContentValueMap']['output'];
  ContentsDatasource: ContentsDatasource;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ContentsDefine;
  ContentsDetail: ContentsDetail;
  DataId: Scalars['DataId']['output'];
  DateCondition: DateCondition;
  ErrorInfo: ErrorInfo;
  EventContent: EventContent;
  EventDefine: EventDefine;
  Float: Scalars['Float']['output'];
  GeoProperties: Scalars['GeoProperties']['output'];
  GeocoderIdInfo: Scalars['GeocoderIdInfo']['output'];
  GeocoderItem: GeocoderItem;
  Geometry: Scalars['Geometry']['output'];
  GetUnpointContentsResult: GetUnpointContentsResult;
  ID: Scalars['ID']['output'];
  IconDefine: Scalars['IconDefine']['output'];
  IconKey: Scalars['IconKey']['output'];
  Int: Scalars['Int']['output'];
  ItemDatasourceConfig: Scalars['ItemDatasourceConfig']['output'];
  ItemDatasourceInfo: ItemDatasourceInfo;
  ItemDefine: ItemDefine;
  JSON: Scalars['JSON']['output'];
  MapDefine: MapDefine;
  MapInfo: MapInfo;
  MapKind: Scalars['MapKind']['output'];
  MapListItem: MapListItem;
  MapMetaInfo: MapMetaInfo;
  MapPageOptions: MapPageOptions;
  Mutation: {};
  NoneConfig: NoneConfig;
  Query: {};
  RegistDataItemInput: RegistDataItemInput;
  ServerConfig: ResolversUnionTypes<ResolversParentTypes>['ServerConfig'];
  String: Scalars['String']['output'];
  Subscription: {};
  Target: Target;
  UnpointContent: UnpointContent;
  UpdateItemInput: UpdateItemInput;
  UpdateItemsResult: UpdateItemsResult;
  User: User;
};

export type Auth0ConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['Auth0Config'] = ResolversParentTypes['Auth0Config']> = {
  audience?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoryDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['CategoryDefine'] = ResolversParentTypes['CategoryDefine']> = {
  categories?: Resolver<Array<ResolversTypes['CategoryItem']>, ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fieldKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoryItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['CategoryItem'] = ResolversParentTypes['CategoryItem']> = {
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export interface ContentDatasourceConfigScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ContentDatasourceConfig'], any> {
  name: 'ContentDatasourceConfig';
}

export type ContentDatasourceInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentDatasourceInfo'] = ResolversParentTypes['ContentDatasourceInfo']> = {
  config?: Resolver<ResolversTypes['ContentDatasourceConfig'], ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface ContentValueMapScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ContentValueMap'], any> {
  name: 'ContentValueMap';
}

export type ContentsDatasourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDatasource'] = ResolversParentTypes['ContentsDatasource']> = {
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentsDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDefine'] = ResolversParentTypes['ContentsDefine']> = {
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasImage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasValue?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  linkedContents?: Resolver<Array<ResolversTypes['ContentsDefine']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentsDetailResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDetail'] = ResolversParentTypes['ContentsDetail']> = {
  anotherMapItemId?: Resolver<Maybe<ResolversTypes['DataId']>, ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  readonly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  usingOtherMap?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['ContentValueMap'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DataIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DataId'], any> {
  name: 'DataId';
}

export type ErrorInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ErrorInfo'] = ResolversParentTypes['ErrorInfo']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  itemId?: Resolver<Maybe<ResolversTypes['DataId']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ErrorType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventContentResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventContent'] = ResolversParentTypes['EventContent']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventDefine'] = ResolversParentTypes['EventDefine']> = {
  contents?: Resolver<Array<ResolversTypes['EventContent']>, ParentType, ContextType>;
  itemDatasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface GeoPropertiesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['GeoProperties'], any> {
  name: 'GeoProperties';
}

export interface GeocoderIdInfoScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['GeocoderIdInfo'], any> {
  name: 'GeocoderIdInfo';
}

export type GeocoderItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderItem'] = ResolversParentTypes['GeocoderItem']> = {
  geometry?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
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

export interface IconDefineScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IconDefine'], any> {
  name: 'IconDefine';
}

export interface IconKeyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IconKey'], any> {
  name: 'IconKey';
}

export interface ItemDatasourceConfigScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ItemDatasourceConfig'], any> {
  name: 'ItemDatasourceConfig';
}

export type ItemDatasourceInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemDatasourceInfo'] = ResolversParentTypes['ItemDatasourceInfo']> = {
  config?: Resolver<ResolversTypes['ItemDatasourceConfig'], ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  groupName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  initialVisible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemDefine'] = ResolversParentTypes['ItemDefine']> = {
  content?: Resolver<Maybe<ResolversTypes['ContentsDefine']>, ParentType, ContextType>;
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  geoProperties?: Resolver<ResolversTypes['GeoProperties'], ParentType, ContextType>;
  geometry?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  lastEditedTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MapDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapDefine'] = ResolversParentTypes['MapDefine']> = {
  defaultMapKind?: Resolver<ResolversTypes['MapKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  options?: Resolver<ResolversTypes['MapPageOptions'], ParentType, ContextType>;
  originalIcons?: Resolver<Array<ResolversTypes['IconDefine']>, ParentType, ContextType>;
  useMaps?: Resolver<Array<ResolversTypes['MapKind']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapInfo'] = ResolversParentTypes['MapInfo']> = {
  contentDataSources?: Resolver<Array<ResolversTypes['ContentDatasourceInfo']>, ParentType, ContextType>;
  extent?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  itemDataSources?: Resolver<Array<ResolversTypes['ItemDatasourceInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface MapKindScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['MapKind'], any> {
  name: 'MapKind';
}

export type MapListItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapListItem'] = ResolversParentTypes['MapListItem']> = {
  authLv?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mapId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapMetaInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapMetaInfo'] = ResolversParentTypes['MapMetaInfo']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keyword?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mapId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapPageOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapPageOptions'] = ResolversParentTypes['MapPageOptions']> = {
  contentsSortCondition?: Resolver<Maybe<ResolversTypes['SortCondition']>, ParentType, ContextType>;
  guestUserAuthLevel?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  itemLabel?: Resolver<Maybe<ResolversTypes['ItemLabelMode']>, ParentType, ContextType>;
  newUserAuthLevel?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  options?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  popupMode?: Resolver<Maybe<ResolversTypes['PopupMode']>, ParentType, ContextType>;
  usePanels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  changeAuthLevel?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationChangeAuthLevelArgs, 'authLv' | 'userId'>>;
  connect?: Resolver<ResolversTypes['ConnectResult'], ParentType, ContextType, RequireFields<MutationConnectArgs, 'mapId'>>;
  disconnect?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  linkData?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkDataArgs, 'id' | 'parent'>>;
  linkDataByOriginalId?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkDataByOriginalIdArgs, 'originalId' | 'parent'>>;
  registData?: Resolver<ResolversTypes['DataId'], ParentType, ContextType, RequireFields<MutationRegistDataArgs, 'datasourceId'>>;
  removeData?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveDataArgs, 'id'>>;
  request?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRequestArgs, 'mapId' | 'name'>>;
  switchMapKind?: Resolver<ResolversTypes['MapInfo'], ParentType, ContextType, RequireFields<MutationSwitchMapKindArgs, 'mapKind'>>;
  unlinkData?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUnlinkDataArgs, 'id' | 'parent'>>;
  updateData?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateDataArgs, 'id'>>;
  updateDataByOriginalId?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateDataByOriginalIdArgs, 'originalId'>>;
};

export type NoneConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['NoneConfig'] = ResolversParentTypes['NoneConfig']> = {
  dummy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  config?: Resolver<ResolversTypes['ServerConfig'], ParentType, ContextType>;
  geocoder?: Resolver<Array<ResolversTypes['GeocoderItem']>, ParentType, ContextType, RequireFields<QueryGeocoderArgs, 'address' | 'searchTarget'>>;
  getCategory?: Resolver<Array<ResolversTypes['CategoryDefine']>, ParentType, ContextType, Partial<QueryGetCategoryArgs>>;
  getContent?: Resolver<ResolversTypes['ContentsDetail'], ParentType, ContextType, RequireFields<QueryGetContentArgs, 'id'>>;
  getEvent?: Resolver<Array<ResolversTypes['EventDefine']>, ParentType, ContextType, Partial<QueryGetEventArgs>>;
  getGeocoderFeature?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType, RequireFields<QueryGetGeocoderFeatureArgs, 'id'>>;
  getImage?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetImageArgs, 'imageId' | 'size'>>;
  getImageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetImageUrlArgs, 'contentId'>>;
  getItems?: Resolver<Array<ResolversTypes['ItemDefine']>, ParentType, ContextType, RequireFields<QueryGetItemsArgs, 'datasourceId' | 'wkt' | 'zoom'>>;
  getItemsById?: Resolver<Array<ResolversTypes['ItemDefine']>, ParentType, ContextType, RequireFields<QueryGetItemsByIdArgs, 'targets'>>;
  getLinkableContentsDatasources?: Resolver<Array<ResolversTypes['ContentsDatasource']>, ParentType, ContextType>;
  getMapList?: Resolver<Array<ResolversTypes['MapListItem']>, ParentType, ContextType>;
  getMapMetaInfo?: Resolver<ResolversTypes['MapMetaInfo'], ParentType, ContextType, RequireFields<QueryGetMapMetaInfoArgs, 'mapId'>>;
  getThumb?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetThumbArgs, 'contentId'>>;
  getUnpointContents?: Resolver<ResolversTypes['GetUnpointContentsResult'], ParentType, ContextType, RequireFields<QueryGetUnpointContentsArgs, 'datasourceId'>>;
  getUserList?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  search?: Resolver<Array<ResolversTypes['DataId']>, ParentType, ContextType, RequireFields<QuerySearchArgs, 'condition'>>;
};

export type ServerConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ServerConfig'] = ResolversParentTypes['ServerConfig']> = {
  __resolveType: TypeResolveFn<'Auth0Config' | 'NoneConfig', ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  categoryUpdateInTheMap?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "categoryUpdateInTheMap", ParentType, ContextType, RequireFields<SubscriptionCategoryUpdateInTheMapArgs, 'mapId' | 'mapKind'>>;
  dataDeleteInTheMap?: SubscriptionResolver<Array<ResolversTypes['DataId']>, "dataDeleteInTheMap", ParentType, ContextType, RequireFields<SubscriptionDataDeleteInTheMapArgs, 'mapId' | 'mapKind'>>;
  dataInsertInTheMap?: SubscriptionResolver<Array<ResolversTypes['Target']>, "dataInsertInTheMap", ParentType, ContextType, RequireFields<SubscriptionDataInsertInTheMapArgs, 'mapId' | 'mapKind'>>;
  dataUpdate?: SubscriptionResolver<ResolversTypes['Operation'], "dataUpdate", ParentType, ContextType, RequireFields<SubscriptionDataUpdateArgs, 'id'>>;
  dataUpdateInTheMap?: SubscriptionResolver<Array<ResolversTypes['Target']>, "dataUpdateInTheMap", ParentType, ContextType, RequireFields<SubscriptionDataUpdateInTheMapArgs, 'mapId' | 'mapKind'>>;
  error?: SubscriptionResolver<ResolversTypes['ErrorInfo'], "error", ParentType, ContextType, RequireFields<SubscriptionErrorArgs, 'sid'>>;
  mapInfoUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "mapInfoUpdate", ParentType, ContextType, RequireFields<SubscriptionMapInfoUpdateArgs, 'mapId'>>;
  updateUserAuth?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "updateUserAuth", ParentType, ContextType, RequireFields<SubscriptionUpdateUserAuthArgs, 'mapId' | 'userId'>>;
  userListUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "userListUpdate", ParentType, ContextType, RequireFields<SubscriptionUserListUpdateArgs, 'mapId'>>;
};

export type TargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['Target'] = ResolversParentTypes['Target']> = {
  datasourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasContent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  wkt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnpointContentResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnpointContent'] = ResolversParentTypes['UnpointContent']> = {
  dataId?: Resolver<Maybe<ResolversTypes['DataId']>, ParentType, ContextType>;
  hasImage?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  originalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  overview?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateItemsResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateItemsResult'] = ResolversParentTypes['UpdateItemsResult']> = {
  error?: Resolver<Maybe<Array<ResolversTypes['DataId']>>, ParentType, ContextType>;
  success?: Resolver<Array<ResolversTypes['DataId']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  authLv?: Resolver<ResolversTypes['Auth'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Auth0Config?: Auth0ConfigResolvers<ContextType>;
  CategoryDefine?: CategoryDefineResolvers<ContextType>;
  CategoryItem?: CategoryItemResolvers<ContextType>;
  ConnectInfo?: ConnectInfoResolvers<ContextType>;
  ConnectResult?: ConnectResultResolvers<ContextType>;
  ContentDatasourceConfig?: GraphQLScalarType;
  ContentDatasourceInfo?: ContentDatasourceInfoResolvers<ContextType>;
  ContentValueMap?: GraphQLScalarType;
  ContentsDatasource?: ContentsDatasourceResolvers<ContextType>;
  ContentsDefine?: ContentsDefineResolvers<ContextType>;
  ContentsDetail?: ContentsDetailResolvers<ContextType>;
  DataId?: GraphQLScalarType;
  ErrorInfo?: ErrorInfoResolvers<ContextType>;
  EventContent?: EventContentResolvers<ContextType>;
  EventDefine?: EventDefineResolvers<ContextType>;
  GeoProperties?: GraphQLScalarType;
  GeocoderIdInfo?: GraphQLScalarType;
  GeocoderItem?: GeocoderItemResolvers<ContextType>;
  Geometry?: GraphQLScalarType;
  GetUnpointContentsResult?: GetUnpointContentsResultResolvers<ContextType>;
  IconDefine?: GraphQLScalarType;
  IconKey?: GraphQLScalarType;
  ItemDatasourceConfig?: GraphQLScalarType;
  ItemDatasourceInfo?: ItemDatasourceInfoResolvers<ContextType>;
  ItemDefine?: ItemDefineResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  MapDefine?: MapDefineResolvers<ContextType>;
  MapInfo?: MapInfoResolvers<ContextType>;
  MapKind?: GraphQLScalarType;
  MapListItem?: MapListItemResolvers<ContextType>;
  MapMetaInfo?: MapMetaInfoResolvers<ContextType>;
  MapPageOptions?: MapPageOptionsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NoneConfig?: NoneConfigResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ServerConfig?: ServerConfigResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Target?: TargetResolvers<ContextType>;
  UnpointContent?: UnpointContentResolvers<ContextType>;
  UpdateItemsResult?: UpdateItemsResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

