/* eslint-disable */
import { Geometry } from 'geojson'
import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap } from '../../types-common/common-types'
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
  IconKey: { input: IconKey; output: IconKey; }
  ItemDatasourceConfig: { input: ItemDatasourceConfig; output: ItemDatasourceConfig; }
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
  __typename?: 'Auth0Config';
  audience: Scalars['String']['output'];
  clientId: Scalars['String']['output'];
  domain: Scalars['String']['output'];
};

export type CategoryDefine = {
  __typename?: 'CategoryDefine';
  color: Scalars['String']['output'];
  datasourceIds: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Condition = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Array<Scalars['String']['input']>>;
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
  anotherMapItemId?: Maybe<Scalars['DataId']['output']>;
  children?: Maybe<Array<ContentsDefine>>;
  date?: Maybe<Scalars['String']['output']>;
  id: Scalars['DataId']['output'];
  image: Scalars['Boolean']['output'];
  isDeletable: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  isSnsContent: Scalars['Boolean']['output'];
  parentId?: Maybe<Scalars['DataId']['output']>;
  title: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  usingAnotherMap: Scalars['Boolean']['output'];
  values: Scalars['ContentValueMap']['output'];
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

export type IconDefine = {
  __typename?: 'IconDefine';
  caption?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imagePath: Scalars['String']['output'];
  useMaps: Array<MapKind>;
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
  /** アイテムに紐づくコンテンツ一覧 */
  contents: Array<ContentsDefine>;
  geoProperties: Scalars['GeoProperties']['output'];
  geometry: Scalars['Geometry']['output'];
  hasContents: Scalars['Boolean']['output'];
  /** 画像を持つコンテンツID一覧 */
  hasImageContentId: Array<Scalars['DataId']['output']>;
  id: Scalars['DataId']['output'];
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum ItemLabelMode {
  Hidden = 'hidden',
  Show = 'show'
}

export type MapDefine = {
  __typename?: 'MapDefine';
  defaultMapKind: MapKind;
  name: Scalars['String']['output'];
  options: MapPageOptions;
  useMaps: Array<MapKind>;
};

export type MapInfo = {
  __typename?: 'MapInfo';
  contentDataSources: Array<ContentDatasourceInfo>;
  extent: Array<Scalars['Float']['output']>;
  itemDataSources: Array<ItemDatasourceInfo>;
  originalIcons: Array<IconDefine>;
};

export enum MapKind {
  Real = 'Real',
  Virtual = 'Virtual'
}

export type MapListItem = {
  __typename?: 'MapListItem';
  mapId: Scalars['String']['output'];
  name: Scalars['String']['output'];
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
  /** 初期表示するデータソースを絞る場合に指定する */
  visibleDataSources: Array<VisibleDataSource>;
};

export type MediaInfo = {
  __typename?: 'MediaInfo';
  type: MediaType;
  url: Scalars['String']['output'];
};

export enum MediaType {
  Video = 'Video',
  Image = 'image'
}

export type Mutation = {
  __typename?: 'Mutation';
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
  updateItems: UpdateItemsResult;
};


export type MutationChangeAuthLevelArgs = {
  authLv: Auth;
  userId: Scalars['ID']['input'];
};


export type MutationConnectArgs = {
  mapId: Scalars['String']['input'];
};


export type MutationLinkContentArgs = {
  id: Scalars['DataId']['input'];
  parent: ParentInput;
};


export type MutationLinkContentsDatasourceArgs = {
  contentsDatasources: Array<ContentsDatasourceInput>;
};


export type MutationRegistContentArgs = {
  datasourceId: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  parent: ParentInput;
  title: Scalars['String']['input'];
  type: ContentType;
  values: Scalars['ContentValueMap']['input'];
};


export type MutationRegistItemArgs = {
  datasourceId: Scalars['String']['input'];
  geoProperties: Scalars['GeoProperties']['input'];
  geometry: Scalars['Geometry']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveContentArgs = {
  id: Scalars['DataId']['input'];
};


export type MutationRemoveItemArgs = {
  id: Scalars['DataId']['input'];
};


export type MutationRequestArgs = {
  mapId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationSwitchMapKindArgs = {
  mapKind: MapKind;
};


export type MutationUnlinkContentArgs = {
  id: Scalars['DataId']['input'];
  parent: ParentInput;
};


export type MutationUnlinkContentsDatasourceArgs = {
  contentsDatasourceIds: Array<Scalars['String']['input']>;
};


export type MutationUpdateContentArgs = {
  deleteImage?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['DataId']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: ContentType;
  values: Scalars['ContentValueMap']['input'];
};


export type MutationUpdateItemsArgs = {
  targets: Array<UpdateItemInput>;
};

export type NoneConfig = {
  __typename?: 'NoneConfig';
  dummy?: Maybe<Scalars['Boolean']['output']>;
};

export type ParentInput = {
  id: Scalars['DataId']['input'];
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
  __typename?: 'Query';
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
  id: Scalars['DataId']['input'];
};


export type QueryGetContentsArgs = {
  ids: Array<Scalars['DataId']['input']>;
};


export type QueryGetContentsInItemArgs = {
  itemId: Scalars['DataId']['input'];
};


export type QueryGetEventArgs = {
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetGeocoderFeatureArgs = {
  id: Scalars['GeocoderIdInfo']['input'];
};


export type QueryGetImageUrlArgs = {
  contentId: Scalars['DataId']['input'];
};


export type QueryGetItemsArgs = {
  datasourceId: Scalars['String']['input'];
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']>>;
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
};


export type QueryGetItemsByIdArgs = {
  targets: Array<Scalars['DataId']['input']>;
};


export type QueryGetSnsPreviewArgs = {
  url: Scalars['String']['input'];
};


export type QueryGetThumbArgs = {
  contentId: Scalars['DataId']['input'];
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

export type SearchHitItem = {
  __typename?: 'SearchHitItem';
  /** 当該アイテム配下の検索条件に合致するコンテンツID一覧 */
  hitContents: Array<Scalars['DataId']['output']>;
  /** 検索条件がアイテム自体にもヒットした場合、True */
  hitItem: Scalars['Boolean']['output'];
  id: Scalars['DataId']['output'];
};

export type ServerConfig = Auth0Config | NoneConfig;

export type SnsPreviewPost = {
  __typename?: 'SnsPreviewPost';
  date?: Maybe<Scalars['String']['output']>;
  media?: Maybe<MediaInfo>;
  text: Scalars['String']['output'];
};

export type SnsPreviewResult = {
  __typename?: 'SnsPreviewResult';
  posts: Array<SnsPreviewPost>;
  type: SnsType;
};

export enum SnsType {
  InstagramUser = 'InstagramUser'
}

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
  /** 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合 */
  childContentsUpdate?: Maybe<Scalars['Boolean']['output']>;
  /**
   * ユーザが操作している地図でエラーが発生した場合にエラー内容を通知する。
   * 突き放し実行している登録、更新処理でエラー発生した場合に通知するために用意。
   */
  error: ErrorInfo;
  /** 地図上のアイテムが削除された場合に通知する */
  itemDelete: Array<Scalars['DataId']['output']>;
  /** 地図上にアイテムが追加された場合に通知する */
  itemInsert: Array<Target>;
  /** 地図上のアイテムが更新された場合に通知する */
  itemUpdate: Array<Target>;
  /** 地図定義に変更があった場合 */
  mapInfoUpdate?: Maybe<Scalars['Boolean']['output']>;
  /** ユーザ権限に更新があった場合 */
  updateUserAuth?: Maybe<Scalars['Boolean']['output']>;
  /** ユーザ一覧情報が更新された場合 */
  userListUpdate?: Maybe<Scalars['Boolean']['output']>;
};


export type SubscriptionChildContentsUpdateArgs = {
  itemId: Scalars['DataId']['input'];
};


export type SubscriptionErrorArgs = {
  sid: Scalars['String']['input'];
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
  __typename?: 'Target';
  /** 対象アイテムのID */
  id: Scalars['DataId']['output'];
  /** アイテムの地図範囲。update時は更新後範囲 */
  wkt: Scalars['String']['output'];
};

export enum ThumbSize {
  Medium = 'Medium',
  Thumbnail = 'Thumbnail'
}

export type UnpointContent = {
  __typename?: 'UnpointContent';
  id: Scalars['DataId']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  thumb?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UpdateItemInput = {
  geoProperties?: InputMaybe<Scalars['GeoProperties']['input']>;
  geometry?: InputMaybe<Scalars['Geometry']['input']>;
  id: Scalars['DataId']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
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

export type VisibleDataSource = VisibleDataSourceDatasource | VisibleDataSourceGroup;

export type VisibleDataSourceDatasource = {
  __typename?: 'VisibleDataSourceDatasource';
  dataSourceId?: Maybe<Scalars['String']['output']>;
};

export type VisibleDataSourceGroup = {
  __typename?: 'VisibleDataSourceGroup';
  group?: Maybe<Scalars['String']['output']>;
};

export type ConnectMutationVariables = Exact<{
  mapId: Scalars['String']['input'];
}>;


export type ConnectMutation = { __typename?: 'Mutation', connect: { __typename?: 'ConnectResult', mapDefine: { __typename?: 'MapDefine', name: string, useMaps: Array<MapKind>, defaultMapKind: MapKind, options: { __typename?: 'MapPageOptions', popupMode?: PopupMode | null, itemLabel?: ItemLabelMode | null, guestUserAuthLevel: Auth, newUserAuthLevel: Auth, usePanels?: Array<string> | null, contentsSortCondition?: SortCondition | null, options?: Array<string> | null, visibleDataSources: Array<{ __typename?: 'VisibleDataSourceDatasource', dataSourceId?: string | null } | { __typename?: 'VisibleDataSourceGroup', group?: string | null }> } }, connect: { __typename?: 'ConnectInfo', sid: string, authLv: Auth, userId?: string | null, userName?: string | null } } };

export type DisconnectMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectMutation = { __typename?: 'Mutation', disconnect?: boolean | null };

export type SwitchMapKindMutationVariables = Exact<{
  mapKind: MapKind;
}>;


export type SwitchMapKindMutation = { __typename?: 'Mutation', switchMapKind: { __typename?: 'MapInfo', extent: Array<number>, itemDataSources: Array<{ __typename?: 'ItemDatasourceInfo', datasourceId: string, name: string, groupName?: string | null, initialVisible: boolean, config: ItemDatasourceConfig }>, contentDataSources: Array<{ __typename?: 'ContentDatasourceInfo', datasourceId: string, name: string, config: ContentDatasourceConfig }>, originalIcons: Array<{ __typename?: 'IconDefine', id: string, caption?: string | null, imagePath: string, useMaps: Array<MapKind> }> } };

export type RegistItemMutationVariables = Exact<{
  datasourceId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  geometry: Scalars['Geometry']['input'];
  geoProperties: Scalars['GeoProperties']['input'];
}>;


export type RegistItemMutation = { __typename?: 'Mutation', registItem?: boolean | null };

export type UpdateItemsMutationVariables = Exact<{
  targets: Array<UpdateItemInput> | UpdateItemInput;
}>;


export type UpdateItemsMutation = { __typename?: 'Mutation', updateItems: { __typename?: 'UpdateItemsResult', success: Array<DataId>, error?: Array<DataId> | null } };

export type RemoveItemMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type RemoveItemMutation = { __typename?: 'Mutation', removeItem?: boolean | null };

export type RegistContentMutationVariables = Exact<{
  parent: ParentInput;
  datasourceId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  values: Scalars['ContentValueMap']['input'];
  type: ContentType;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type RegistContentMutation = { __typename?: 'Mutation', registContent?: boolean | null };

export type UpdateContentMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  values: Scalars['ContentValueMap']['input'];
  type: ContentType;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  deleteImage?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateContentMutation = { __typename?: 'Mutation', updateContent?: boolean | null };

export type LinkContentMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  parent: ParentInput;
}>;


export type LinkContentMutation = { __typename?: 'Mutation', linkContent?: boolean | null };

export type UnlinkContentMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  parent: ParentInput;
}>;


export type UnlinkContentMutation = { __typename?: 'Mutation', unlinkContent?: boolean | null };

export type RemoveContentMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type RemoveContentMutation = { __typename?: 'Mutation', removeContent?: boolean | null };

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

export type LinkContentsDatasourceMutationVariables = Exact<{
  contentsDatasources: Array<ContentsDatasourceInput> | ContentsDatasourceInput;
}>;


export type LinkContentsDatasourceMutation = { __typename?: 'Mutation', linkContentsDatasource?: boolean | null };

export type UnlinkContentsDatasourceMutationVariables = Exact<{
  contentsDatasourceIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type UnlinkContentsDatasourceMutation = { __typename?: 'Mutation', unlinkContentsDatasource?: boolean | null };

export type ConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type ConfigQuery = { __typename?: 'Query', config: { __typename?: 'Auth0Config', domain: string, clientId: string, audience: string } | { __typename?: 'NoneConfig', dummy?: boolean | null } };

export type GetMapListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMapListQuery = { __typename?: 'Query', getMapList: Array<{ __typename?: 'MapListItem', mapId: string, name: string }> };

export type GetCategoryQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory: Array<{ __typename?: 'CategoryDefine', name: string, color: string, datasourceIds: Array<string> }> };

export type GetEventQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetEventQuery = { __typename?: 'Query', getEvent: Array<{ __typename?: 'EventDefine', itemDatasourceId: string, contents: Array<{ __typename?: 'EventContent', id: DataId, date: string }> }> };

export type GetItemsQueryVariables = Exact<{
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
  datasourceId: Scalars['String']['input'];
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetItemsQuery = { __typename?: 'Query', getItems: Array<{ __typename?: 'ItemDefine', id: DataId, name: string, geometry: Geometry, geoProperties: GeoProperties, lastEditedTime: string, hasContents: boolean, hasImageContentId: Array<DataId>, contents: Array<{ __typename?: 'ContentsDefine', id: DataId, image: boolean, children?: Array<{ __typename?: 'ContentsDefine', id: DataId, image: boolean }> | null }> }> };

export type GetItemsByIdQueryVariables = Exact<{
  targets: Array<Scalars['DataId']['input']> | Scalars['DataId']['input'];
}>;


export type GetItemsByIdQuery = { __typename?: 'Query', getItemsById: Array<{ __typename?: 'ItemDefine', id: DataId, name: string, geometry: Geometry, geoProperties: GeoProperties, lastEditedTime: string, hasContents: boolean, hasImageContentId: Array<DataId>, contents: Array<{ __typename?: 'ContentsDefine', id: DataId, image: boolean, children?: Array<{ __typename?: 'ContentsDefine', id: DataId, image: boolean }> | null }> }> };

export type GetContentQueryVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type GetContentQuery = { __typename?: 'Query', getContent: { __typename?: 'ContentsDefine', id: DataId, url?: string | null, title: string, image: boolean, parentId?: DataId | null, values: ContentValueMap, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean } };

export type GetContentsQueryVariables = Exact<{
  ids: Array<Scalars['DataId']['input']> | Scalars['DataId']['input'];
}>;


export type GetContentsQuery = { __typename?: 'Query', getContents: Array<{ __typename?: 'ContentsDefine', id: DataId, url?: string | null, title: string, image: boolean, parentId?: DataId | null, values: ContentValueMap, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean }> };

export type GetContentsInItemQueryVariables = Exact<{
  itemId: Scalars['DataId']['input'];
}>;


export type GetContentsInItemQuery = { __typename?: 'Query', getContentsInItem: Array<{ __typename?: 'ContentsDefine', id: DataId, url?: string | null, title: string, image: boolean, parentId?: DataId | null, values: ContentValueMap, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean, children?: Array<{ __typename?: 'ContentsDefine', id: DataId, url?: string | null, title: string, image: boolean, parentId?: DataId | null, values: ContentValueMap, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean }> | null }> };

export type ContentFragment = { __typename?: 'ContentsDefine', id: DataId, url?: string | null, title: string, image: boolean, parentId?: DataId | null, values: ContentValueMap, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean };

export type GetUnpointContentsQueryVariables = Exact<{
  datasourceId: Scalars['String']['input'];
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUnpointContentsQuery = { __typename?: 'Query', getUnpointContents: { __typename?: 'GetUnpointContentsResult', nextToken?: string | null, contents: Array<{ __typename?: 'UnpointContent', id: DataId, title: string, thumb?: string | null, overview?: string | null }> } };

export type GetThumbQueryVariables = Exact<{
  contentId: Scalars['DataId']['input'];
  size?: InputMaybe<ThumbSize>;
}>;


export type GetThumbQuery = { __typename?: 'Query', getThumb: string };

export type GetImageUrlQueryVariables = Exact<{
  contentId: Scalars['DataId']['input'];
}>;


export type GetImageUrlQuery = { __typename?: 'Query', getImageUrl: string };

export type SearchQueryVariables = Exact<{
  condition: Condition;
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchHitItem', id: DataId, hitContents: Array<DataId>, hitItem: boolean }> };

export type GeocoderQueryVariables = Exact<{
  address: Scalars['String']['input'];
  searchTarget: Array<GeocoderTarget> | GeocoderTarget;
}>;


export type GeocoderQuery = { __typename?: 'Query', geocoder: Array<{ __typename?: 'GeocoderItem', idInfo: GeocoderIdInfo, name: string, geometry: Geometry }> };

export type GetGeocoderFeatureQueryVariables = Exact<{
  id: Scalars['GeocoderIdInfo']['input'];
}>;


export type GetGeocoderFeatureQuery = { __typename?: 'Query', getGeocoderFeature: Geometry };

export type GetSnsPreviewQueryVariables = Exact<{
  url: Scalars['String']['input'];
}>;


export type GetSnsPreviewQuery = { __typename?: 'Query', getSnsPreview: { __typename?: 'SnsPreviewResult', type: SnsType, posts: Array<{ __typename?: 'SnsPreviewPost', text: string, date?: string | null, media?: { __typename?: 'MediaInfo', type: MediaType, url: string } | null }> } };

export type GetUserListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserListQuery = { __typename?: 'Query', getUserList: Array<{ __typename?: 'User', id: string, name: string, authLv: Auth }> };

export type GetLinkableContentsDatasourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLinkableContentsDatasourcesQuery = { __typename?: 'Query', getLinkableContentsDatasources: Array<{ __typename?: 'ContentsDatasource', datasourceId: string, name: string }> };

export type ItemInsertSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
}>;


export type ItemInsertSubscription = { __typename?: 'Subscription', itemInsert: Array<{ __typename?: 'Target', id: DataId, wkt: string }> };

export type ItemUpdateSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
}>;


export type ItemUpdateSubscription = { __typename?: 'Subscription', itemUpdate: Array<{ __typename?: 'Target', id: DataId, wkt: string }> };

export type ItemDeleteSubscriptionVariables = Exact<{
  mapId: Scalars['String']['input'];
  mapKind: MapKind;
}>;


export type ItemDeleteSubscription = { __typename?: 'Subscription', itemDelete: Array<DataId> };

export type ChildContentsUpdateSubscriptionVariables = Exact<{
  itemId: Scalars['DataId']['input'];
}>;


export type ChildContentsUpdateSubscription = { __typename?: 'Subscription', childContentsUpdate?: boolean | null };

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

export const ContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<ContentFragment, unknown>;
export const ConnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"connect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapDefine"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"useMaps"}},{"kind":"Field","name":{"kind":"Name","value":"defaultMapKind"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popupMode"}},{"kind":"Field","name":{"kind":"Name","value":"itemLabel"}},{"kind":"Field","name":{"kind":"Name","value":"visibleDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VisibleDataSourceDatasource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VisibleDataSourceGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guestUserAuthLevel"}},{"kind":"Field","name":{"kind":"Name","value":"newUserAuthLevel"}},{"kind":"Field","name":{"kind":"Name","value":"usePanels"}},{"kind":"Field","name":{"kind":"Name","value":"contentsSortCondition"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"connect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sid"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}}]}}]}}]}}]} as unknown as DocumentNode<ConnectMutation, ConnectMutationVariables>;
export const DisconnectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"disconnect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnect"}}]}}]} as unknown as DocumentNode<DisconnectMutation, DisconnectMutationVariables>;
export const SwitchMapKindDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"switchMapKind"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchMapKind"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"extent"}},{"kind":"Field","name":{"kind":"Name","value":"itemDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"initialVisible"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}},{"kind":"Field","name":{"kind":"Name","value":"originalIcons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}},{"kind":"Field","name":{"kind":"Name","value":"imagePath"}},{"kind":"Field","name":{"kind":"Name","value":"useMaps"}}]}}]}}]}}]} as unknown as DocumentNode<SwitchMapKindMutation, SwitchMapKindMutationVariables>;
export const RegistItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"registItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geometry"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Geometry"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geoProperties"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeoProperties"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"geometry"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geometry"}}},{"kind":"Argument","name":{"kind":"Name","value":"geoProperties"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geoProperties"}}}]}]}}]} as unknown as DocumentNode<RegistItemMutation, RegistItemMutationVariables>;
export const UpdateItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateItemInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targets"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateItemsMutation, UpdateItemsMutationVariables>;
export const RemoveItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveItemMutation, RemoveItemMutationVariables>;
export const RegistContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"registContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"values"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentValueMap"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"values"},"value":{"kind":"Variable","name":{"kind":"Name","value":"values"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}}]}]}}]} as unknown as DocumentNode<RegistContentMutation, RegistContentMutationVariables>;
export const UpdateContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"values"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentValueMap"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deleteImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"values"},"value":{"kind":"Variable","name":{"kind":"Name","value":"values"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"deleteImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deleteImage"}}}]}]}}]} as unknown as DocumentNode<UpdateContentMutation, UpdateContentMutationVariables>;
export const LinkContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<LinkContentMutation, LinkContentMutationVariables>;
export const UnlinkContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unlinkContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<UnlinkContentMutation, UnlinkContentMutationVariables>;
export const RemoveContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveContentMutation, RemoveContentMutationVariables>;
export const ChangeAuthLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"changeAuthLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Auth"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeAuthLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"authLv"},"value":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}}}]}]}}]} as unknown as DocumentNode<ChangeAuthLevelMutation, ChangeAuthLevelMutationVariables>;
export const RequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"request"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"request"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}]}}]} as unknown as DocumentNode<RequestMutation, RequestMutationVariables>;
export const LinkContentsDatasourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkContentsDatasource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasources"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDatasourceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkContentsDatasource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentsDatasources"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasources"}}}]}]}}]} as unknown as DocumentNode<LinkContentsDatasourceMutation, LinkContentsDatasourceMutationVariables>;
export const UnlinkContentsDatasourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unlinkContentsDatasource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasourceIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkContentsDatasource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentsDatasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasourceIds"}}}]}]}}]} as unknown as DocumentNode<UnlinkContentsDatasourceMutation, UnlinkContentsDatasourceMutationVariables>;
export const ConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NoneConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dummy"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Auth0Config"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}}]}}]}}]}}]} as unknown as DocumentNode<ConfigQuery, ConfigQueryVariables>;
export const GetMapListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getMapList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMapList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetMapListQuery, GetMapListQueryVariables>;
export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceIds"}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;
export const GetEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemDatasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]}}]} as unknown as DocumentNode<GetEventQuery, GetEventQueryVariables>;
export const GetItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"wkt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}}},{"kind":"Argument","name":{"kind":"Name","value":"zoom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"latestEditedTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeItemIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"hasContents"}},{"kind":"Field","name":{"kind":"Name","value":"hasImageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetItemsQuery, GetItemsQueryVariables>;
export const GetItemsByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItemsById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItemsById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targets"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"hasContents"}},{"kind":"Field","name":{"kind":"Name","value":"hasImageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetItemsByIdQuery, GetItemsByIdQueryVariables>;
export const GetContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentQuery, GetContentQueryVariables>;
export const GetContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentsQuery, GetContentsQueryVariables>;
export const GetContentsInItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContentsInItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContentsInItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"values"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentsInItemQuery, GetContentsInItemQueryVariables>;
export const GetUnpointContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUnpointContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUnpointContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nextToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"thumb"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextToken"}}]}}]}}]} as unknown as DocumentNode<GetUnpointContentsQuery, GetUnpointContentsQueryVariables>;
export const GetThumbDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getThumb"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"size"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ThumbSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getThumb"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"size"}}}]}]}}]} as unknown as DocumentNode<GetThumbQuery, GetThumbQueryVariables>;
export const GetImageUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getImageUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getImageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}}]}]}}]} as unknown as DocumentNode<GetImageUrlQuery, GetImageUrlQueryVariables>;
export const SearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Condition"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hitContents"}},{"kind":"Field","name":{"kind":"Name","value":"hitItem"}}]}}]}}]} as unknown as DocumentNode<SearchQuery, SearchQueryVariables>;
export const GeocoderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"geocoder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchTarget"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeocoderTarget"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geocoder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchTarget"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"idInfo"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"}}]}}]}}]} as unknown as DocumentNode<GeocoderQuery, GeocoderQueryVariables>;
export const GetGeocoderFeatureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getGeocoderFeature"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeocoderIdInfo"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getGeocoderFeature"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GetGeocoderFeatureQuery, GetGeocoderFeatureQueryVariables>;
export const GetSnsPreviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSnsPreview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSnsPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"posts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]}}]} as unknown as DocumentNode<GetSnsPreviewQuery, GetSnsPreviewQueryVariables>;
export const GetUserListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}}]}}]}}]} as unknown as DocumentNode<GetUserListQuery, GetUserListQueryVariables>;
export const GetLinkableContentsDatasourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetLinkableContentsDatasourcesQuery, GetLinkableContentsDatasourcesQueryVariables>;
export const ItemInsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"itemInsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemInsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wkt"}}]}}]}}]} as unknown as DocumentNode<ItemInsertSubscription, ItemInsertSubscriptionVariables>;
export const ItemUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"itemUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wkt"}}]}}]}}]} as unknown as DocumentNode<ItemUpdateSubscription, ItemUpdateSubscriptionVariables>;
export const ItemDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"itemDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}]}]}}]} as unknown as DocumentNode<ItemDeleteSubscription, ItemDeleteSubscriptionVariables>;
export const ChildContentsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"childContentsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"childContentsUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}}]}]}}]} as unknown as DocumentNode<ChildContentsUpdateSubscription, ChildContentsUpdateSubscriptionVariables>;
export const UpdateUserAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"updateUserAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<UpdateUserAuthSubscription, UpdateUserAuthSubscriptionVariables>;
export const UserListUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"userListUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userListUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<UserListUpdateSubscription, UserListUpdateSubscriptionVariables>;
export const MapInfoUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"mapInfoUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapInfoUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapId"}}}]}]}}]} as unknown as DocumentNode<MapInfoUpdateSubscription, MapInfoUpdateSubscriptionVariables>;
export const ErrorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"error"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sid"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}}]}}]}}]} as unknown as DocumentNode<ErrorSubscription, ErrorSubscriptionVariables>;