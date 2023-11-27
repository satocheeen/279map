import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { DataId } from '279map-common'
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
  DataId: { input: DataId; output: DataId; }
};

export enum Auth {
  Admin = 'Admin',
  Edit = 'Edit',
  None = 'None',
  Request = 'Request',
  View = 'View'
}

export type CategoryDefine = {
  color: Scalars['String']['output'];
  dataSourceIds: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export enum ContentType {
  Normal = 'normal',
  Sns = 'sns'
}

export type ContentsDatasource = {
  dataSourceId: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ContentsDatasourceInput = {
  dataSourceId: Scalars['String']['input'];
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

export type EventDefine = {
  dataSourceId?: Maybe<Scalars['String']['output']>;
  dates: Array<Scalars['String']['output']>;
};

export type GetUnpointContentsResult = {
  contents: Array<UnpointContent>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type ItemDefine = {
  id: Scalars['DataId']['output'];
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  changeAuthLevel?: Maybe<Scalars['Boolean']['output']>;
  linkContent?: Maybe<Scalars['Boolean']['output']>;
  linkContentsDatasource?: Maybe<Scalars['Boolean']['output']>;
  registContent?: Maybe<Scalars['Boolean']['output']>;
  removeContent?: Maybe<Scalars['Boolean']['output']>;
  removeItem?: Maybe<Scalars['Boolean']['output']>;
  unlinkContent?: Maybe<Scalars['Boolean']['output']>;
  updateContent?: Maybe<Scalars['Boolean']['output']>;
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
  dataSourceId: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  parent: ParentInput;
  title: Scalars['String']['input'];
  type: ContentType;
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveContentArgs = {
  id: Scalars['DataId']['input'];
};


export type MutationRemoveItemArgs = {
  id: Scalars['DataId']['input'];
};


export type MutationUnlinkContentArgs = {
  id: Scalars['DataId']['input'];
  parent: ParentInput;
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

export type ParentInput = {
  id: Scalars['DataId']['input'];
  type: ParentOfContent;
};

export enum ParentOfContent {
  Content = 'Content',
  Item = 'Item'
}

export type Query = {
  getCategory: Array<CategoryDefine>;
  getContent: ContentsDefine;
  getContents: Array<ContentsDefine>;
  getContentsInItem: Array<ContentsDefine>;
  getEvent: Array<EventDefine>;
  getItems?: Maybe<Array<Maybe<ItemDefine>>>;
  getLinkableContentsDatasources: Array<ContentsDatasource>;
  getUnpointContents: GetUnpointContentsResult;
  getUserList: Array<User>;
};


export type QueryGetCategoryArgs = {
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
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
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetItemsArgs = {
  dataSourceId: Scalars['String']['input'];
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']>>;
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
};


export type QueryGetUnpointContentsArgs = {
  dataSourceId: Scalars['String']['input'];
  nextToken?: InputMaybe<Scalars['String']['input']>;
};

export type UnpointContent = {
  id: Scalars['DataId']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  thumb?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
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



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Auth: Auth;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CategoryDefine: ResolverTypeWrapper<CategoryDefine>;
  ContentType: ContentType;
  ContentsDatasource: ResolverTypeWrapper<ContentsDatasource>;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ResolverTypeWrapper<ContentsDefine>;
  DataId: ResolverTypeWrapper<Scalars['DataId']['output']>;
  EventDefine: ResolverTypeWrapper<EventDefine>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GetUnpointContentsResult: ResolverTypeWrapper<GetUnpointContentsResult>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  ItemDefine: ResolverTypeWrapper<ItemDefine>;
  Mutation: ResolverTypeWrapper<{}>;
  ParentInput: ParentInput;
  ParentOfContent: ParentOfContent;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UnpointContent: ResolverTypeWrapper<UnpointContent>;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CategoryDefine: CategoryDefine;
  ContentsDatasource: ContentsDatasource;
  ContentsDatasourceInput: ContentsDatasourceInput;
  ContentsDefine: ContentsDefine;
  DataId: Scalars['DataId']['output'];
  EventDefine: EventDefine;
  Float: Scalars['Float']['output'];
  GetUnpointContentsResult: GetUnpointContentsResult;
  ID: Scalars['ID']['output'];
  ItemDefine: ItemDefine;
  Mutation: {};
  ParentInput: ParentInput;
  Query: {};
  String: Scalars['String']['output'];
  UnpointContent: UnpointContent;
  User: User;
};

export type CategoryDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['CategoryDefine'] = ResolversParentTypes['CategoryDefine']> = {
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dataSourceIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentsDatasourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentsDatasource'] = ResolversParentTypes['ContentsDatasource']> = {
  dataSourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type EventDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventDefine'] = ResolversParentTypes['EventDefine']> = {
  dataSourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dates?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GetUnpointContentsResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['GetUnpointContentsResult'] = ResolversParentTypes['GetUnpointContentsResult']> = {
  contents?: Resolver<Array<ResolversTypes['UnpointContent']>, ParentType, ContextType>;
  nextToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemDefineResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemDefine'] = ResolversParentTypes['ItemDefine']> = {
  id?: Resolver<ResolversTypes['DataId'], ParentType, ContextType>;
  lastEditedTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  changeAuthLevel?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationChangeAuthLevelArgs, 'authLv' | 'userId'>>;
  linkContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkContentArgs, 'id' | 'parent'>>;
  linkContentsDatasource?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationLinkContentsDatasourceArgs, 'contentsDatasources'>>;
  registContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRegistContentArgs, 'dataSourceId' | 'parent' | 'title' | 'type'>>;
  removeContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRemoveContentArgs, 'id'>>;
  removeItem?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRemoveItemArgs, 'id'>>;
  unlinkContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUnlinkContentArgs, 'id' | 'parent'>>;
  updateContent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUpdateContentArgs, 'id' | 'type'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getCategory?: Resolver<Array<ResolversTypes['CategoryDefine']>, ParentType, ContextType, Partial<QueryGetCategoryArgs>>;
  getContent?: Resolver<ResolversTypes['ContentsDefine'], ParentType, ContextType, RequireFields<QueryGetContentArgs, 'id'>>;
  getContents?: Resolver<Array<ResolversTypes['ContentsDefine']>, ParentType, ContextType, RequireFields<QueryGetContentsArgs, 'ids'>>;
  getContentsInItem?: Resolver<Array<ResolversTypes['ContentsDefine']>, ParentType, ContextType, RequireFields<QueryGetContentsInItemArgs, 'itemId'>>;
  getEvent?: Resolver<Array<ResolversTypes['EventDefine']>, ParentType, ContextType, Partial<QueryGetEventArgs>>;
  getItems?: Resolver<Maybe<Array<Maybe<ResolversTypes['ItemDefine']>>>, ParentType, ContextType, RequireFields<QueryGetItemsArgs, 'dataSourceId' | 'wkt' | 'zoom'>>;
  getLinkableContentsDatasources?: Resolver<Array<ResolversTypes['ContentsDatasource']>, ParentType, ContextType>;
  getUnpointContents?: Resolver<ResolversTypes['GetUnpointContentsResult'], ParentType, ContextType, RequireFields<QueryGetUnpointContentsArgs, 'dataSourceId'>>;
  getUserList?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
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
  CategoryDefine?: CategoryDefineResolvers<ContextType>;
  ContentsDatasource?: ContentsDatasourceResolvers<ContextType>;
  ContentsDefine?: ContentsDefineResolvers<ContextType>;
  DataId?: GraphQLScalarType;
  EventDefine?: EventDefineResolvers<ContextType>;
  GetUnpointContentsResult?: GetUnpointContentsResultResolvers<ContextType>;
  ItemDefine?: ItemDefineResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  UnpointContent?: UnpointContentResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

