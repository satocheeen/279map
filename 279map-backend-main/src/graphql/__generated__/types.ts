import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { DataId, GeocoderId } from '279map-common'
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
  DataId: { input: DataId; output: DataId; }
  GeocoderId: { input: any; output: any; }
  Geometry: { input: Geometry; output: Geometry; }
  IconKey: { input: any; output: any; }
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

export type Condition = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ContentConfig = {
  deletable: Scalars['Boolean']['output'];
  disableUnlinkMap?: Maybe<Scalars['Boolean']['output']>;
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
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
  anotherMapItemId?: Maybe<Scalars['DataId']['output']>;
  category?: Maybe<Array<Scalars['String']['output']>>;
  children?: Maybe<Array<ContentsDefine>>;
  date?: Maybe<Scalars['String']['output']>;
  id: Scalars['DataId']['output'];
  image: Scalars['Boolean']['output'];
  isDeletable: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  isSnsContent: Scalars['Boolean']['output'];
  itemId: Scalars['DataId']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  parentId?: Maybe<Scalars['DataId']['output']>;
  title: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  usingAnotherMap: Scalars['Boolean']['output'];
  videoUrl?: Maybe<Scalars['String']['output']>;
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

export type EventDefine = {
  datasourceId?: Maybe<Scalars['String']['output']>;
  dates: Array<Scalars['String']['output']>;
};

export type GeocoderItem = {
  geoJson: Scalars['Geometry']['output'];
  idInfo: Scalars['GeocoderId']['output'];
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

export type IconDefine = {
  caption?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imagePath: Scalars['String']['output'];
  useMaps: Array<MapKind>;
};

export type ItemConfig = {
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
};

export type ItemDefine = {
  geoJson: Scalars['Geometry']['output'];
  geoProperties: Scalars['JSON']['output'];
  hasContents: Scalars['Boolean']['output'];
  hasImageContentId: Array<Scalars['DataId']['output']>;
  id: Scalars['DataId']['output'];
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
  temporary?: Maybe<ItemTemporaryState>;
};

export enum ItemTemporaryState {
  Registing = 'Registing',
  Updateing = 'Updateing'
}

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


export type MutationLinkContentArgs = {
  id: Scalars['DataId']['input'];
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
  geoProperties: Scalars['JSON']['input'];
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
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['DataId']['input'];
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

export type ParentInput = {
  id: Scalars['DataId']['input'];
  type: ParentOfContent;
};

export enum ParentOfContent {
  Content = 'Content',
  Item = 'Item'
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
  id: Scalars['GeocoderId']['input'];
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

export type RealPointContentConfig = {
  defaultIcon?: Maybe<Scalars['IconKey']['output']>;
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
  linkableContents: Scalars['Boolean']['output'];
};

export type SearchHitItem = {
  hitContents: Array<Scalars['DataId']['output']>;
  id: Scalars['DataId']['output'];
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

export type UnpointContent = {
  id: Scalars['DataId']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  thumb?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UpdateItemInput = {
  geoProperties?: InputMaybe<Scalars['JSON']['input']>;
  geometry?: InputMaybe<Scalars['Geometry']['input']>;
  id: Scalars['DataId']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
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
  DatasourceConfig: ( ContentConfig ) | ( ItemConfig ) | ( RealPointContentConfig ) | ( TrackConfig );
  ServerConfig: ( Auth0Config ) | ( NoneConfig );
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Auth: Auth;
  Auth0Config: ResolverTypeWrapper<Auth0Config>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CategoryDefine: ResolverTypeWrapper<CategoryDefine>;
  Condition: Condition;
  ContentConfig: ResolverTypeWrapper<ContentConfig>;
  ContentType: ContentType;
  ContentsDatasource: ResolverTypeWrapper<ContentsDatasource>;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ResolverTypeWrapper<ContentsDefine>;
  DataId: ResolverTypeWrapper<Scalars['DataId']['output']>;
  DatasourceConfig: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['DatasourceConfig']>;
  DatasourceGroup: ResolverTypeWrapper<DatasourceGroup>;
  DatasourceInfo: ResolverTypeWrapper<Omit<DatasourceInfo, 'config'> & { config: ResolversTypes['DatasourceConfig'] }>;
  DatasourceKindType: DatasourceKindType;
  EventDefine: ResolverTypeWrapper<EventDefine>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GeocoderId: ResolverTypeWrapper<Scalars['GeocoderId']['output']>;
  GeocoderItem: ResolverTypeWrapper<GeocoderItem>;
  GeocoderTarget: GeocoderTarget;
  Geometry: ResolverTypeWrapper<Scalars['Geometry']['output']>;
  GetUnpointContentsResult: ResolverTypeWrapper<GetUnpointContentsResult>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IconDefine: ResolverTypeWrapper<IconDefine>;
  IconKey: ResolverTypeWrapper<Scalars['IconKey']['output']>;
  ItemConfig: ResolverTypeWrapper<ItemConfig>;
  ItemDefine: ResolverTypeWrapper<ItemDefine>;
  ItemTemporaryState: ItemTemporaryState;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  MapInfo: ResolverTypeWrapper<MapInfo>;
  MapKind: MapKind;
  MediaInfo: ResolverTypeWrapper<MediaInfo>;
  MediaType: MediaType;
  Mutation: ResolverTypeWrapper<{}>;
  NoneConfig: ResolverTypeWrapper<NoneConfig>;
  ParentInput: ParentInput;
  ParentOfContent: ParentOfContent;
  Query: ResolverTypeWrapper<{}>;
  RealPointContentConfig: ResolverTypeWrapper<RealPointContentConfig>;
  SearchHitItem: ResolverTypeWrapper<SearchHitItem>;
  ServerConfig: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ServerConfig']>;
  SnsPreviewPost: ResolverTypeWrapper<SnsPreviewPost>;
  SnsPreviewResult: ResolverTypeWrapper<SnsPreviewResult>;
  SnsType: SnsType;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  ThumbSize: ThumbSize;
  TrackConfig: ResolverTypeWrapper<TrackConfig>;
  UnpointContent: ResolverTypeWrapper<UnpointContent>;
  UpdateItemInput: UpdateItemInput;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Auth0Config: Auth0Config;
  Boolean: Scalars['Boolean']['output'];
  CategoryDefine: CategoryDefine;
  Condition: Condition;
  ContentConfig: ContentConfig;
  ContentsDatasource: ContentsDatasource;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ContentsDefine;
  DataId: Scalars['DataId']['output'];
  DatasourceConfig: ResolversUnionTypes<ResolversParentTypes>['DatasourceConfig'];
  DatasourceGroup: DatasourceGroup;
  DatasourceInfo: Omit<DatasourceInfo, 'config'> & { config: ResolversParentTypes['DatasourceConfig'] };
  EventDefine: EventDefine;
  Float: Scalars['Float']['output'];
  GeocoderId: Scalars['GeocoderId']['output'];
  GeocoderItem: GeocoderItem;
  Geometry: Scalars['Geometry']['output'];
  GetUnpointContentsResult: GetUnpointContentsResult;
  ID: Scalars['ID']['output'];
  IconDefine: IconDefine;
  IconKey: Scalars['IconKey']['output'];
  ItemConfig: ItemConfig;
  ItemDefine: ItemDefine;
  JSON: Scalars['JSON']['output'];
  MapInfo: MapInfo;
  MediaInfo: MediaInfo;
  Mutation: {};
  NoneConfig: NoneConfig;
  ParentInput: ParentInput;
  Query: {};
  RealPointContentConfig: RealPointContentConfig;
  SearchHitItem: SearchHitItem;
  ServerConfig: ResolversUnionTypes<ResolversParentTypes>['ServerConfig'];
  SnsPreviewPost: SnsPreviewPost;
  SnsPreviewResult: SnsPreviewResult;
  String: Scalars['String']['output'];
  TrackConfig: TrackConfig;
  UnpointContent: UnpointContent;
  UpdateItemInput: UpdateItemInput;
  User: User;
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

export interface DataIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DataId'], any> {
  name: 'DataId';
}

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

export interface GeocoderIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['GeocoderId'], any> {
  name: 'GeocoderId';
}

export type GeocoderItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeocoderItem'] = ResolversParentTypes['GeocoderItem']> = {
  geoJson?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
  idInfo?: Resolver<ResolversTypes['GeocoderId'], ParentType, ContextType>;
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

export type IconDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['IconDefine'] = ResolversParentTypes['IconDefine']> = {
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  useMaps?: Resolver<Array<ResolversTypes['MapKind']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface IconKeyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IconKey'], any> {
  name: 'IconKey';
}

export type ItemConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemConfig'] = ResolversParentTypes['ItemConfig']> = {
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  layerGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemDefine'] = ResolversParentTypes['ItemDefine']> = {
  geoJson?: Resolver<ResolversTypes['Geometry'], ParentType, ContextType>;
  geoProperties?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
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

export type MapInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapInfo'] = ResolversParentTypes['MapInfo']> = {
  contentDataSources?: Resolver<Array<ResolversTypes['DatasourceInfo']>, ParentType, ContextType>;
  extent?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  itemDataSourceGroups?: Resolver<Array<ResolversTypes['DatasourceGroup']>, ParentType, ContextType>;
  originalIcons?: Resolver<Array<ResolversTypes['IconDefine']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaInfo'] = ResolversParentTypes['MediaInfo']> = {
  type?: Resolver<ResolversTypes['MediaType'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  changeAuthLevel?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationChangeAuthLevelArgs, 'authLv' | 'userId'>>;
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

export type TrackConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrackConfig'] = ResolversParentTypes['TrackConfig']> = {
  deletable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  editable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['DatasourceKindType'], ParentType, ContextType>;
  layerGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type Resolvers<ContextType = any> = {
  Auth0Config?: Auth0ConfigResolvers<ContextType>;
  CategoryDefine?: CategoryDefineResolvers<ContextType>;
  ContentConfig?: ContentConfigResolvers<ContextType>;
  ContentsDatasource?: ContentsDatasourceResolvers<ContextType>;
  ContentsDefine?: ContentsDefineResolvers<ContextType>;
  DataId?: GraphQLScalarType;
  DatasourceConfig?: DatasourceConfigResolvers<ContextType>;
  DatasourceGroup?: DatasourceGroupResolvers<ContextType>;
  DatasourceInfo?: DatasourceInfoResolvers<ContextType>;
  EventDefine?: EventDefineResolvers<ContextType>;
  GeocoderId?: GraphQLScalarType;
  GeocoderItem?: GeocoderItemResolvers<ContextType>;
  Geometry?: GraphQLScalarType;
  GetUnpointContentsResult?: GetUnpointContentsResultResolvers<ContextType>;
  IconDefine?: IconDefineResolvers<ContextType>;
  IconKey?: GraphQLScalarType;
  ItemConfig?: ItemConfigResolvers<ContextType>;
  ItemDefine?: ItemDefineResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  MapInfo?: MapInfoResolvers<ContextType>;
  MediaInfo?: MediaInfoResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NoneConfig?: NoneConfigResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RealPointContentConfig?: RealPointContentConfigResolvers<ContextType>;
  SearchHitItem?: SearchHitItemResolvers<ContextType>;
  ServerConfig?: ServerConfigResolvers<ContextType>;
  SnsPreviewPost?: SnsPreviewPostResolvers<ContextType>;
  SnsPreviewResult?: SnsPreviewResultResolvers<ContextType>;
  TrackConfig?: TrackConfigResolvers<ContextType>;
  UnpointContent?: UnpointContentResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

