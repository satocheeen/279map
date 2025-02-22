import { Geometry } from 'geojson'
import { DataId, GeoProperties, GeocoderIdInfo, IconKey, ItemDatasourceConfig, ContentDatasourceConfig, ContentValueMap, ContentValueMapInput, MapKind, IconDefine } from '../../types-common/common-types'
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
  ContentValueMapInput: { input: ContentValueMapInput; output: ContentValueMapInput; }
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

export enum PopupMode {
  Hidden = 'hidden',
  Maximum = 'maximum',
  Minimum = 'minimum',
  OnlyImage = 'onlyImage'
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

export type User = {
  authLv: Auth;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};
