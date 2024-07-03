/* eslint-disable */
import { Geometry } from 'geojson'
import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap, MapKind, IconDefine } from '../../types-common/common-types'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  __typename?: 'Auth0Config';
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
  __typename?: 'CategoryDefine';
  /** 属するカテゴリ一覧 */
  categories: Array<CategoryItem>;
  /** 対象のコンテンツデータソースID */
  datasourceId: Scalars['String']['output'];
  /** 対象のフィールド */
  fieldKey: Scalars['String']['output'];
};

export type CategoryItem = {
  __typename?: 'CategoryItem';
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
  __typename?: 'ConnectInfo';
  authLv: Auth;
  sid: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type ConnectResult = {
  __typename?: 'ConnectResult';
  connect: ConnectInfo;
  mapDefine: MapDefine;
};

export type ContentDatasourceInfo = {
  __typename?: 'ContentDatasourceInfo';
  config: Scalars['ContentDatasourceConfig']['output'];
  datasourceId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum ContentType {
  Normal = 'normal',
  Sns = 'sns'
}

export type ContentsDatasource = {
  __typename?: 'ContentsDatasource';
  datasourceId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ContentsDatasourceInput = {
  datasourceId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ContentsDefine = {
  __typename?: 'ContentsDefine';
  /** もう片方の地図で参照されている場合に、その参照元のID */
  anotherMapItemId?: Maybe<Scalars['DataId']['output']>;
  datasourceId: Scalars['String']['output'];
  hasImage: Scalars['Boolean']['output'];
  hasValue: Scalars['Boolean']['output'];
  id: Scalars['DataId']['output'];
  parentId?: Maybe<Scalars['DataId']['output']>;
  /** trueの場合、ユーザ権限に関わらずreadonly */
  readonly?: Maybe<Scalars['Boolean']['output']>;
  /** 他の地図でも参照されているか */
  usingOtherMap: Scalars['Boolean']['output'];
  values: Scalars['ContentValueMap']['output'];
};

export type DateCondition = {
  /** 日付文字列 */
  date: Scalars['String']['input'];
  /** クライアント端末のUTCからの時差 */
  utcOffset: Scalars['Int']['input'];
};

export type ErrorInfo = {
  __typename?: 'ErrorInfo';
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
  __typename?: 'EventContent';
  date: Scalars['String']['output'];
  id: Scalars['DataId']['output'];
};

export type EventDefine = {
  __typename?: 'EventDefine';
  /** 日付を持つコンテンツ一覧 */
  contents: Array<EventContent>;
  itemDatasourceId: Scalars['String']['output'];
};

export type GeocoderItem = {
  __typename?: 'GeocoderItem';
  geometry: Scalars['Geometry']['output'];
  idInfo: Scalars['GeocoderIdInfo']['output'];
  name: Scalars['String']['output'];
};

export enum GeocoderTarget {
  Area = 'Area',
  Point = 'Point'
}

export type GetUnpointContentsResult = {
  __typename?: 'GetUnpointContentsResult';
  contents: Array<UnpointContent>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type ItemDatasourceInfo = {
  __typename?: 'ItemDatasourceInfo';
  config: Scalars['ItemDatasourceConfig']['output'];
  datasourceId: Scalars['String']['output'];
  groupName?: Maybe<Scalars['String']['output']>;
  initialVisible: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type ItemDefine = {
  __typename?: 'ItemDefine';
  /** アイテムと対になるコンテンツ */
  content?: Maybe<ContentsDefine>;
  datasourceId: Scalars['String']['output'];
  geoProperties: Scalars['GeoProperties']['output'];
  geometry: Scalars['Geometry']['output'];
  id: Scalars['DataId']['output'];
  lastEditedTime: Scalars['String']['output'];
  /** アイテムに紐づけられたコンテンツ */
  linkedContents: Array<ContentsDefine>;
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
  __typename?: 'MapDefine';
  defaultMapKind: Scalars['MapKind']['output'];
  name: Scalars['String']['output'];
  options: MapPageOptions;
  originalIcons: Array<Scalars['IconDefine']['output']>;
  useMaps: Array<Scalars['MapKind']['output']>;
};

export type MapInfo = {
  __typename?: 'MapInfo';
  contentDataSources: Array<ContentDatasourceInfo>;
  extent: Array<Scalars['Float']['output']>;
  itemDataSources: Array<ItemDatasourceInfo>;
};

export type MapListItem = {
  __typename?: 'MapListItem';
  authLv: Auth;
  description?: Maybe<Scalars['String']['output']>;
  mapId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
};

export type MapPageOptions = {
  __typename?: 'MapPageOptions';
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
  __typename?: 'Mutation';
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
  __typename?: 'NoneConfig';
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
  __typename?: 'Query';
  config: ServerConfig;
  geocoder: Array<GeocoderItem>;
  getCategory: Array<CategoryDefine>;
  getContent: ContentsDefine;
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
  __typename?: 'Subscription';
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
  __typename?: 'Target';
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
  __typename?: 'UnpointContent';
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
  __typename?: 'UpdateItemsResult';
  error?: Maybe<Array<Scalars['DataId']['output']>>;
  success: Array<Scalars['DataId']['output']>;
};

export type User = {
  __typename?: 'User';
  authLv: Auth;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type ConnectMutationVariables = Exact<{
  mapId: Scalars['String']['input'];
}>;


export type ConnectMutation = { __typename?: 'Mutation', connect: { __typename?: 'ConnectResult', mapDefine: { __typename?: 'MapDefine', name: string, useMaps: Array<MapKind>, defaultMapKind: MapKind, originalIcons: Array<IconDefine>, options: { __typename?: 'MapPageOptions', popupMode?: PopupMode | null, itemLabel?: ItemLabelMode | null, guestUserAuthLevel: Auth, newUserAuthLevel: Auth, usePanels?: Array<string> | null, contentsSortCondition?: SortCondition | null, options?: Array<string> | null } }, connect: { __typename?: 'ConnectInfo', sid: string, authLv: Auth, userId?: string | null, userName?: string | null } } };

export type DisconnectMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectMutation = { __typename?: 'Mutation', disconnect?: boolean | null };

export type SwitchMapKindMutationVariables = Exact<{
  mapKind: Scalars['MapKind']['input'];
}>;


export type SwitchMapKindMutation = { __typename?: 'Mutation', switchMapKind: { __typename?: 'MapInfo', extent: Array<number>, itemDataSources: Array<{ __typename?: 'ItemDatasourceInfo', datasourceId: string, name: string, groupName?: string | null, initialVisible: boolean, config: ItemDatasourceConfig }>, contentDataSources: Array<{ __typename?: 'ContentDatasourceInfo', datasourceId: string, name: string, config: ContentDatasourceConfig }> } };

export type RegistDataMutationVariables = Exact<{
  datasourceId: Scalars['String']['input'];
  item?: InputMaybe<RegistDataItemInput>;
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
  linkDatas?: InputMaybe<Array<Scalars['DataId']['input']> | Scalars['DataId']['input']>;
}>;


export type RegistDataMutation = { __typename?: 'Mutation', registData: DataId };

export type UpdateDataMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  item?: InputMaybe<RegistDataItemInput>;
  deleteItem?: InputMaybe<Scalars['Boolean']['input']>;
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
}>;


export type UpdateDataMutation = { __typename?: 'Mutation', updateData: boolean };

export type UpdateDataByOriginalIdMutationVariables = Exact<{
  originalId: Scalars['String']['input'];
  item?: InputMaybe<RegistDataItemInput>;
  contents?: InputMaybe<Scalars['ContentValueMap']['input']>;
}>;


export type UpdateDataByOriginalIdMutation = { __typename?: 'Mutation', updateDataByOriginalId: boolean };

export type RemoveDataMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type RemoveDataMutation = { __typename?: 'Mutation', removeData: boolean };

export type LinkDataMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  parent: Scalars['DataId']['input'];
}>;


export type LinkDataMutation = { __typename?: 'Mutation', linkData?: boolean | null };

export type LinkDataByOriginalIdMutationVariables = Exact<{
  originalId: Scalars['String']['input'];
  parent: Scalars['DataId']['input'];
}>;


export type LinkDataByOriginalIdMutation = { __typename?: 'Mutation', linkDataByOriginalId?: boolean | null };

export type UnlinkDataMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  parent: Scalars['DataId']['input'];
}>;


export type UnlinkDataMutation = { __typename?: 'Mutation', unlinkData?: boolean | null };

export type ChangeAuthLevelMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  authLv: Auth;
}>;


export type ChangeAuthLevelMutation = { __typename?: 'Mutation', changeAuthLevel?: boolean | null };

export type RequestMutationVariables = Exact<{
  mapId: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type RequestMutation = { __typename?: 'Mutation', request?: boolean | null };

export type ConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type ConfigQuery = { __typename?: 'Query', config: { __typename?: 'Auth0Config', domain: string, clientId: string, audience: string } | { __typename?: 'NoneConfig', dummy?: boolean | null } };

export type GetMapListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMapListQuery = { __typename?: 'Query', getMapList: Array<{ __typename?: 'MapListItem', mapId: string, authLv: Auth, name: string, description?: string | null, thumbnail?: string | null }> };

export type GetCategoryQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory: Array<{ __typename?: 'CategoryDefine', datasourceId: string, fieldKey: string, categories: Array<{ __typename?: 'CategoryItem', value: string, color: string }> }> };

export type GetEventQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetEventQuery = { __typename?: 'Query', getEvent: Array<{ __typename?: 'EventDefine', itemDatasourceId: string, contents: Array<{ __typename?: 'EventContent', id: DataId, date: string }> }> };

export type GetItemsQueryVariables = Exact<{
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
  datasourceId: Scalars['String']['input'];
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  excludeItemIds?: InputMaybe<Array<Scalars['DataId']['input']> | Scalars['DataId']['input']>;
}>;


export type GetItemsQuery = { __typename?: 'Query', getItems: Array<{ __typename?: 'ItemDefine', id: DataId, datasourceId: string, name: string, geometry: Geometry, geoProperties: GeoProperties, lastEditedTime: string, content?: { __typename?: 'ContentsDefine', id: DataId, datasourceId: string, usingOtherMap: boolean, hasValue: boolean, hasImage: boolean } | null, linkedContents: Array<{ __typename?: 'ContentsDefine', id: DataId, datasourceId: string, usingOtherMap: boolean, hasValue: boolean, hasImage: boolean }> }> };

export type GetItemsByIdQueryVariables = Exact<{
  targets: Array<Scalars['DataId']['input']> | Scalars['DataId']['input'];
}>;


export type GetItemsByIdQuery = { __typename?: 'Query', getItemsById: Array<{ __typename?: 'ItemDefine', id: DataId, datasourceId: string, name: string, geometry: Geometry, geoProperties: GeoProperties, lastEditedTime: string, content?: { __typename?: 'ContentsDefine', id: DataId, datasourceId: string, usingOtherMap: boolean, hasValue: boolean, hasImage: boolean } | null, linkedContents: Array<{ __typename?: 'ContentsDefine', id: DataId, datasourceId: string, usingOtherMap: boolean, hasValue: boolean, hasImage: boolean }> }> };

export type GetContentQueryVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type GetContentQuery = { __typename?: 'Query', getContent: { __typename?: 'ContentsDefine', id: DataId, datasourceId: string, parentId?: DataId | null, values: ContentValueMap, usingOtherMap: boolean, anotherMapItemId?: DataId | null, readonly?: boolean | null, hasValue: boolean, hasImage: boolean } };

export type GetUnpointContentsQueryVariables = Exact<{
  datasourceId: Scalars['String']['input'];
  nextToken?: InputMaybe<Scalars['String']['input']>;
  keyword?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUnpointContentsQuery = { __typename?: 'Query', getUnpointContents: { __typename?: 'GetUnpointContentsResult', nextToken?: string | null, contents: Array<{ __typename?: 'UnpointContent', originalId: string, dataId?: DataId | null, title: string, overview?: string | null, hasImage?: boolean | null }> } };

export type GetThumbQueryVariables = Exact<{
  contentId: Scalars['DataId']['input'];
}>;


export type GetThumbQuery = { __typename?: 'Query', getThumb: string };

export type GetImageQueryVariables = Exact<{
  imageId: Scalars['Int']['input'];
  size: ThumbSize;
}>;


export type GetImageQuery = { __typename?: 'Query', getImage: string };

export type GetImageUrlQueryVariables = Exact<{
  contentId: Scalars['DataId']['input'];
}>;


export type GetImageUrlQuery = { __typename?: 'Query', getImageUrl: string };

export type SearchQueryVariables = Exact<{
  condition: Condition;
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<DataId> };

export type GeocoderQueryVariables = Exact<{
  address: Scalars['String']['input'];
  searchTarget: Array<GeocoderTarget> | GeocoderTarget;
}>;


export type GeocoderQuery = { __typename?: 'Query', geocoder: Array<{ __typename?: 'GeocoderItem', idInfo: GeocoderIdInfo, name: string, geometry: Geometry }> };

export type GetGeocoderFeatureQueryVariables = Exact<{
  id: Scalars['GeocoderIdInfo']['input'];
}>;


export type GetGeocoderFeatureQuery = { __typename?: 'Query', getGeocoderFeature: Geometry };

export type GetUserListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserListQuery = { __typename?: 'Query', getUserList: Array<{ __typename?: 'User', id: string, name: string, authLv: Auth }> };

export type GetLinkableContentsDatasourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLinkableContentsDatasourcesQuery = { __typename?: 'Query', getLinkableContentsDatasources: Array<{ __typename?: 'ContentsDatasource', datasourceId: string, name: string }> };

export type DataInsertInTheMapSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
}>;


export type DataInsertInTheMapSubscription = { __typename?: 'Subscription', dataInsertInTheMap: Array<{ __typename?: 'Target', id: DataId, datasourceId: string, hasItem: boolean, hasContent: boolean, wkt?: string | null }> };

export type DataUpdateInTheMapSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
}>;


export type DataUpdateInTheMapSubscription = { __typename?: 'Subscription', dataUpdateInTheMap: Array<{ __typename?: 'Target', id: DataId, datasourceId: string, hasItem: boolean, hasContent: boolean, wkt?: string | null }> };

export type DataDeleteInTheMapSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: Scalars['MapKind']['input'];
}>;


export type DataDeleteInTheMapSubscription = { __typename?: 'Subscription', dataDeleteInTheMap: Array<DataId> };

export type DataUpdateSubscriptionVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type DataUpdateSubscription = { __typename?: 'Subscription', dataUpdate: Operation };

export type UpdateUserAuthSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
  mapId: Scalars['String']['input'];
}>;


export type UpdateUserAuthSubscription = { __typename?: 'Subscription', updateUserAuth?: boolean | null };

export type UserListUpdateSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
}>;


export type UserListUpdateSubscription = { __typename?: 'Subscription', userListUpdate?: boolean | null };

export type MapInfoUpdateSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
}>;


export type MapInfoUpdateSubscription = { __typename?: 'Subscription', mapInfoUpdate?: boolean | null };

export type ErrorSubscriptionVariables = Exact<{
  sid: Scalars['String']['input'];
}>;


export type ErrorSubscription = { __typename?: 'Subscription', error: { __typename?: 'ErrorInfo', type: ErrorType, description?: string | null, itemId?: DataId | null } };


export const ConnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"connect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapDefine"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"useMaps"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMapKind"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popupMode"}},{"kind":"Field","name":{"kind":"Name","value":"itemLabel"}},{"kind":"Field","name":{"kind":"Name","value":"guestUserAuthLevel"}},{"kind":"Field","name":{"kind":"Name","value":"newUserAuthLevel"}},{"kind":"Field","name":{"kind":"Name","value":"usePanels"}},{"kind":"Field","name":{"kind":"Name","value":"contentsSortCondition"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"originalIcons"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sid"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}}]}}]}}]}}]} as unknown as DocumentNode<ConnectMutation, ConnectMutationVariables>;
export const DisconnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"disconnect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnect"}}]}}]} as unknown as DocumentNode<DisconnectMutation, DisconnectMutationVariables>;
export const SwitchMapKindDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"switchMapKind"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchMapKind"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"extent"}},{"kind":"Field","name":{"kind":"Name","value":"itemDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"initialVisible"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]} as unknown as DocumentNode<SwitchMapKindMutation, SwitchMapKindMutationVariables>;
export const RegistDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"registData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"item"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RegistDataItemInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contents"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentValueMap"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"linkDatas"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"item"},"value":{"kind":"Variable","name":{"kind":"Name","value":"item"}}},{"kind":"Argument","name":{"kind":"Name","value":"contents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contents"}}},{"kind":"Argument","name":{"kind":"Name","value":"linkDatas"},"value":{"kind":"Variable","name":{"kind":"Name","value":"linkDatas"}}}]}]}}]} as unknown as DocumentNode<RegistDataMutation, RegistDataMutationVariables>;
export const UpdateDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"item"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RegistDataItemInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deleteItem"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contents"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentValueMap"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"item"},"value":{"kind":"Variable","name":{"kind":"Name","value":"item"}}},{"kind":"Argument","name":{"kind":"Name","value":"deleteItem"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deleteItem"}}},{"kind":"Argument","name":{"kind":"Name","value":"contents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contents"}}}]}]}}]} as unknown as DocumentNode<UpdateDataMutation, UpdateDataMutationVariables>;
export const UpdateDataByOriginalIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateDataByOriginalId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"originalId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"item"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RegistDataItemInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contents"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentValueMap"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDataByOriginalId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"originalId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"originalId"}}},{"kind":"Argument","name":{"kind":"Name","value":"item"},"value":{"kind":"Variable","name":{"kind":"Name","value":"item"}}},{"kind":"Argument","name":{"kind":"Name","value":"contents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contents"}}}]}]}}]} as unknown as DocumentNode<UpdateDataByOriginalIdMutation, UpdateDataByOriginalIdMutationVariables>;
export const RemoveDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveDataMutation, RemoveDataMutationVariables>;
export const LinkDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<LinkDataMutation, LinkDataMutationVariables>;
export const LinkDataByOriginalIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkDataByOriginalId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"originalId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkDataByOriginalId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"originalId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"originalId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<LinkDataByOriginalIdMutation, LinkDataByOriginalIdMutationVariables>;
export const UnlinkDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unlinkData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<UnlinkDataMutation, UnlinkDataMutationVariables>;
export const ChangeAuthLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"changeAuthLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Auth"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeAuthLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"authLv"},"value":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}}}]}]}}]} as unknown as DocumentNode<ChangeAuthLevelMutation, ChangeAuthLevelMutationVariables>;
export const RequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"request"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"request"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}]}}]} as unknown as DocumentNode<RequestMutation, RequestMutationVariables>;
export const ConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NoneConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dummy"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Auth0Config"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}}]}}]}}]}}]} as unknown as DocumentNode<ConfigQuery, ConfigQueryVariables>;
export const GetMapListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getMapList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMapList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapId"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail"}}]}}]}}]} as unknown as DocumentNode<GetMapListQuery, GetMapListQueryVariables>;
export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"fieldKey"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;
export const GetEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemDatasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]}}]} as unknown as DocumentNode<GetEventQuery, GetEventQueryVariables>;
export const GetItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"wkt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}}},{"kind":"Argument","name":{"kind":"Name","value":"zoom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"latestEditedTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeItemIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"content"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"usingOtherMap"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"linkedContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"usingOtherMap"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}}]}}]}}]} as unknown as DocumentNode<GetItemsQuery, GetItemsQueryVariables>;
export const GetItemsByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItemsById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItemsById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targets"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"content"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"usingOtherMap"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"linkedContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"usingOtherMap"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}}]}}]}}]} as unknown as DocumentNode<GetItemsByIdQuery, GetItemsByIdQueryVariables>;
export const GetContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"usingOtherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"readonly"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}}]}}]} as unknown as DocumentNode<GetContentQuery, GetContentQueryVariables>;
export const GetUnpointContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUnpointContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUnpointContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nextToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"originalId"}},{"kind":"Field","name":{"kind":"Name","value":"dataId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextToken"}}]}}]}}]} as unknown as DocumentNode<GetUnpointContentsQuery, GetUnpointContentsQueryVariables>;
export const GetThumbDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getThumb"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getThumb"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}}]}]}}]} as unknown as DocumentNode<GetThumbQuery, GetThumbQueryVariables>;
export const GetImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ThumbSize"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"imageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"size"}}}]}]}}]} as unknown as DocumentNode<GetImageQuery, GetImageQueryVariables>;
export const GetImageUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getImageUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getImageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}}]}]}}]} as unknown as DocumentNode<GetImageUrlQuery, GetImageUrlQueryVariables>;
export const SearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Condition"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}]}]}}]} as unknown as DocumentNode<SearchQuery, SearchQueryVariables>;
export const GeocoderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"geocoder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchTarget"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeocoderTarget"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geocoder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchTarget"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"idInfo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}}]}}]}}]} as unknown as DocumentNode<GeocoderQuery, GeocoderQueryVariables>;
export const GetGeocoderFeatureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getGeocoderFeature"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeocoderIdInfo"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getGeocoderFeature"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GetGeocoderFeatureQuery, GetGeocoderFeatureQueryVariables>;
export const GetUserListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}}]}}]}}]} as unknown as DocumentNode<GetUserListQuery, GetUserListQueryVariables>;
export const GetLinkableContentsDatasourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetLinkableContentsDatasourcesQuery, GetLinkableContentsDatasourcesQueryVariables>;
export const DataInsertInTheMapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"dataInsertInTheMap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataInsertInTheMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"hasItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasContent"}},{"kind":"Field","name":{"kind":"Name","value":"wkt"}}]}}]}}]} as unknown as DocumentNode<DataInsertInTheMapSubscription, DataInsertInTheMapSubscriptionVariables>;
export const DataUpdateInTheMapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"dataUpdateInTheMap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataUpdateInTheMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"hasItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasContent"}},{"kind":"Field","name":{"kind":"Name","value":"wkt"}}]}}]}}]} as unknown as DocumentNode<DataUpdateInTheMapSubscription, DataUpdateInTheMapSubscriptionVariables>;
export const DataDeleteInTheMapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"dataDeleteInTheMap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataDeleteInTheMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}]}]}}]} as unknown as DocumentNode<DataDeleteInTheMapSubscription, DataDeleteInTheMapSubscriptionVariables>;
export const DataUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"dataUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DataUpdateSubscription, DataUpdateSubscriptionVariables>;
export const UpdateUserAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"updateUserAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<UpdateUserAuthSubscription, UpdateUserAuthSubscriptionVariables>;
export const UserListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"userListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userListUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<UserListUpdateSubscription, UserListUpdateSubscriptionVariables>;
export const MapInfoUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"mapInfoUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapInfoUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<MapInfoUpdateSubscription, MapInfoUpdateSubscriptionVariables>;
export const ErrorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"error"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sid"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}}]}}]}}]} as unknown as DocumentNode<ErrorSubscription, ErrorSubscriptionVariables>;