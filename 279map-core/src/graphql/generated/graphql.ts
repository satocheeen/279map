/* eslint-disable */
import { DataId } from '279map-common'
import { Geometry } from 'geojson'
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
  DataId: { input: DataId; output: DataId; }
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

export type ContentConfig = {
  __typename?: 'ContentConfig';
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
  __typename?: 'DatasourceGroup';
  datasources: Array<DatasourceInfo>;
  name?: Maybe<Scalars['String']['output']>;
  visible: Scalars['Boolean']['output'];
};

export type DatasourceInfo = {
  __typename?: 'DatasourceInfo';
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
  __typename?: 'EventDefine';
  datasourceId?: Maybe<Scalars['String']['output']>;
  dates: Array<Scalars['String']['output']>;
};

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

export type ItemConfig = {
  __typename?: 'ItemConfig';
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
};

export type ItemDefine = {
  __typename?: 'ItemDefine';
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
  __typename?: 'MapInfo';
  contentDataSources: Array<DatasourceInfo>;
  extent: Array<Scalars['Float']['output']>;
  itemDataSourceGroups: Array<DatasourceGroup>;
  originalIcons: Array<IconDefine>;
};

export enum MapKind {
  Real = 'Real',
  Virtual = 'Virtual'
}

export type Mutation = {
  __typename?: 'Mutation';
  changeAuthLevel?: Maybe<Scalars['Boolean']['output']>;
  linkContent?: Maybe<Scalars['Boolean']['output']>;
  linkContentsDatasource?: Maybe<Scalars['Boolean']['output']>;
  registContent?: Maybe<Scalars['Boolean']['output']>;
  registItem?: Maybe<Scalars['Boolean']['output']>;
  removeContent?: Maybe<Scalars['Boolean']['output']>;
  removeItem?: Maybe<Scalars['Boolean']['output']>;
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

export type ParentInput = {
  id: Scalars['DataId']['input'];
  type: ParentOfContent;
};

export enum ParentOfContent {
  Content = 'Content',
  Item = 'Item'
}

export type Query = {
  __typename?: 'Query';
  getCategory: Array<CategoryDefine>;
  getContent: ContentsDefine;
  getContents: Array<ContentsDefine>;
  getContentsInItem: Array<ContentsDefine>;
  getEvent: Array<EventDefine>;
  getImageUrl: Scalars['String']['output'];
  getItems: Array<ItemDefine>;
  getItemsById: Array<ItemDefine>;
  getLinkableContentsDatasources: Array<ContentsDatasource>;
  getThumb: Scalars['String']['output'];
  getUnpointContents: GetUnpointContentsResult;
  getUserList: Array<User>;
  search: Array<SearchHitItem>;
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
  __typename?: 'RealPointContentConfig';
  defaultIcon?: Maybe<Scalars['IconKey']['output']>;
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
  linkableContents: Scalars['Boolean']['output'];
};

export type SearchHitItem = {
  __typename?: 'SearchHitItem';
  hitContents: Array<Scalars['DataId']['output']>;
  id: Scalars['DataId']['output'];
};

export enum ThumbSize {
  Medium = 'Medium',
  Thumbnail = 'Thumbnail'
}

export type TrackConfig = {
  __typename?: 'TrackConfig';
  deletable: Scalars['Boolean']['output'];
  editable: Scalars['Boolean']['output'];
  kind: DatasourceKindType;
  layerGroup?: Maybe<Scalars['String']['output']>;
};

export type UnpointContent = {
  __typename?: 'UnpointContent';
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
  __typename?: 'User';
  authLv: Auth;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type DatasourceInfoFragment = { __typename?: 'DatasourceInfo', datasourceId: string, name: string, visible: boolean, kind: DatasourceKindType, config: { __typename?: 'ContentConfig', linkableChildContents: boolean, disableUnlinkMap?: boolean | null, editable: boolean, deletable: boolean } | { __typename?: 'ItemConfig', layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'RealPointContentConfig', defaultIcon?: any | null, linkableContents: boolean, layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'TrackConfig' } };

export type SwitchMapKindMutationVariables = Exact<{
  mapKind: MapKind;
}>;


export type SwitchMapKindMutation = { __typename?: 'Mutation', switchMapKind: { __typename?: 'MapInfo', extent: Array<number>, itemDataSourceGroups: Array<{ __typename?: 'DatasourceGroup', name?: string | null, visible: boolean, datasources: Array<{ __typename?: 'DatasourceInfo', datasourceId: string, name: string, visible: boolean, kind: DatasourceKindType, config: { __typename?: 'ContentConfig', linkableChildContents: boolean, disableUnlinkMap?: boolean | null, editable: boolean, deletable: boolean } | { __typename?: 'ItemConfig', layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'RealPointContentConfig', defaultIcon?: any | null, linkableContents: boolean, layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'TrackConfig' } }> }>, contentDataSources: Array<{ __typename?: 'DatasourceInfo', datasourceId: string, name: string, visible: boolean, kind: DatasourceKindType, config: { __typename?: 'ContentConfig', linkableChildContents: boolean, disableUnlinkMap?: boolean | null, editable: boolean, deletable: boolean } | { __typename?: 'ItemConfig', layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'RealPointContentConfig', defaultIcon?: any | null, linkableContents: boolean, layerGroup?: string | null, editable: boolean, deletable: boolean } | { __typename?: 'TrackConfig' } }>, originalIcons: Array<{ __typename?: 'IconDefine', id: string, caption?: string | null, imagePath: string, useMaps: Array<MapKind> }> } };

export type RegistItemMutationVariables = Exact<{
  datasourceId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  geometry: Scalars['Geometry']['input'];
  geoProperties: Scalars['JSON']['input'];
}>;


export type RegistItemMutation = { __typename?: 'Mutation', registItem?: boolean | null };

export type UpdateItemMutationVariables = Exact<{
  targets: Array<UpdateItemInput> | UpdateItemInput;
}>;


export type UpdateItemMutation = { __typename?: 'Mutation', updateItem?: boolean | null };

export type RemoveItemMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type RemoveItemMutation = { __typename?: 'Mutation', removeItem?: boolean | null };

export type RegistContentMutationVariables = Exact<{
  parent: ParentInput;
  datasourceId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  overview?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  type: ContentType;
  date?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
}>;


export type RegistContentMutation = { __typename?: 'Mutation', registContent?: boolean | null };

export type UpdateContentMutationVariables = Exact<{
  id: Scalars['DataId']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  type: ContentType;
  date?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
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

export type LinkContentsDatasourceMutationVariables = Exact<{
  contentsDatasources: Array<ContentsDatasourceInput> | ContentsDatasourceInput;
}>;


export type LinkContentsDatasourceMutation = { __typename?: 'Mutation', linkContentsDatasource?: boolean | null };

export type UnlinkContentsDatasourceMutationVariables = Exact<{
  contentsDatasourceIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type UnlinkContentsDatasourceMutation = { __typename?: 'Mutation', unlinkContentsDatasource?: boolean | null };

export type GetCategoryQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory: Array<{ __typename?: 'CategoryDefine', name: string, color: string, datasourceIds: Array<string> }> };

export type GetEventQueryVariables = Exact<{
  datasourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetEventQuery = { __typename?: 'Query', getEvent: Array<{ __typename?: 'EventDefine', datasourceId?: string | null, dates: Array<string> }> };

export type GetItemsQueryVariables = Exact<{
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
  datasourceId: Scalars['String']['input'];
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetItemsQuery = { __typename?: 'Query', getItems: Array<{ __typename?: 'ItemDefine', id: DataId, name: string, geoJson: Geometry, geoProperties: any, lastEditedTime: string, hasContents: boolean, hasImageContentId: Array<DataId>, temporary?: ItemTemporaryState | null }> };

export type GetItemsByIdQueryVariables = Exact<{
  targets: Array<Scalars['DataId']['input']> | Scalars['DataId']['input'];
}>;


export type GetItemsByIdQuery = { __typename?: 'Query', getItemsById: Array<{ __typename?: 'ItemDefine', id: DataId, name: string, geoJson: Geometry, geoProperties: any, lastEditedTime: string, hasContents: boolean, hasImageContentId: Array<DataId>, temporary?: ItemTemporaryState | null }> };

export type GetContentQueryVariables = Exact<{
  id: Scalars['DataId']['input'];
}>;


export type GetContentQuery = { __typename?: 'Query', getContent: { __typename?: 'ContentsDefine', id: DataId, itemId: DataId, date?: string | null, url?: string | null, title: string, overview?: string | null, category?: Array<string> | null, image: boolean, videoUrl?: string | null, parentId?: DataId | null, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean } };

export type GetContentsQueryVariables = Exact<{
  ids: Array<Scalars['DataId']['input']> | Scalars['DataId']['input'];
}>;


export type GetContentsQuery = { __typename?: 'Query', getContents: Array<{ __typename?: 'ContentsDefine', id: DataId, itemId: DataId, date?: string | null, url?: string | null, title: string, overview?: string | null, category?: Array<string> | null, image: boolean, videoUrl?: string | null, parentId?: DataId | null, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean }> };

export type GetContentsInItemQueryVariables = Exact<{
  itemId: Scalars['DataId']['input'];
}>;


export type GetContentsInItemQuery = { __typename?: 'Query', getContentsInItem: Array<{ __typename?: 'ContentsDefine', id: DataId, itemId: DataId, date?: string | null, url?: string | null, title: string, overview?: string | null, category?: Array<string> | null, image: boolean, videoUrl?: string | null, parentId?: DataId | null, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean, children?: Array<{ __typename?: 'ContentsDefine', id: DataId, itemId: DataId, date?: string | null, url?: string | null, title: string, overview?: string | null, category?: Array<string> | null, image: boolean, videoUrl?: string | null, parentId?: DataId | null, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean }> | null }> };

export type ContentFragment = { __typename?: 'ContentsDefine', id: DataId, itemId: DataId, date?: string | null, url?: string | null, title: string, overview?: string | null, category?: Array<string> | null, image: boolean, videoUrl?: string | null, parentId?: DataId | null, usingAnotherMap: boolean, anotherMapItemId?: DataId | null, isSnsContent: boolean, isEditable: boolean, isDeletable: boolean };

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


export type SearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchHitItem', id: DataId, hitContents: Array<DataId> }> };

export type GetUserListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserListQuery = { __typename?: 'Query', getUserList: Array<{ __typename?: 'User', id: string, name: string, authLv: Auth }> };

export type GetLinkableContentsDatasourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLinkableContentsDatasourcesQuery = { __typename?: 'Query', getLinkableContentsDatasources: Array<{ __typename?: 'ContentsDatasource', datasourceId: string, name: string }> };

export const DatasourceInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"datasourceInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DatasourceInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visible"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ItemConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"layerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RealPointContentConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultIcon"}},{"kind":"Field","name":{"kind":"Name","value":"linkableContents"}},{"kind":"Field","name":{"kind":"Name","value":"layerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkableChildContents"}},{"kind":"Field","name":{"kind":"Name","value":"disableUnlinkMap"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}}]}}]}}]} as unknown as DocumentNode<DatasourceInfoFragment, unknown>;
export const ContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<ContentFragment, unknown>;
export const SwitchMapKindDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"switchMapKind"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapKind"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchMapKind"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mapKind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mapKind"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"extent"}},{"kind":"Field","name":{"kind":"Name","value":"itemDataSourceGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visible"}},{"kind":"Field","name":{"kind":"Name","value":"datasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"datasourceInfo"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"datasourceInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"originalIcons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}},{"kind":"Field","name":{"kind":"Name","value":"imagePath"}},{"kind":"Field","name":{"kind":"Name","value":"useMaps"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"datasourceInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DatasourceInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"visible"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ItemConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"layerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RealPointContentConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultIcon"}},{"kind":"Field","name":{"kind":"Name","value":"linkableContents"}},{"kind":"Field","name":{"kind":"Name","value":"layerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkableChildContents"}},{"kind":"Field","name":{"kind":"Name","value":"disableUnlinkMap"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}},{"kind":"Field","name":{"kind":"Name","value":"deletable"}}]}}]}}]}}]} as unknown as DocumentNode<SwitchMapKindMutation, SwitchMapKindMutationVariables>;
export const RegistItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"registItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geometry"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Geometry"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geoProperties"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"geometry"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geometry"}}},{"kind":"Argument","name":{"kind":"Name","value":"geoProperties"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geoProperties"}}}]}]}}]} as unknown as DocumentNode<RegistItemMutation, RegistItemMutationVariables>;
export const UpdateItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateItemInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targets"}}}]}]}}]} as unknown as DocumentNode<UpdateItemMutation, UpdateItemMutationVariables>;
export const RemoveItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveItemMutation, RemoveItemMutationVariables>;
export const RegistContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"registContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"overview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categories"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"overview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"overview"}}},{"kind":"Argument","name":{"kind":"Name","value":"categories"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categories"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}]}}]} as unknown as DocumentNode<RegistContentMutation, RegistContentMutationVariables>;
export const UpdateContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"overview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categories"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"overview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"overview"}}},{"kind":"Argument","name":{"kind":"Name","value":"categories"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categories"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}]}}]} as unknown as DocumentNode<UpdateContentMutation, UpdateContentMutationVariables>;
export const LinkContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<LinkContentMutation, LinkContentMutationVariables>;
export const UnlinkContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unlinkContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"parent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parent"}}}]}]}}]} as unknown as DocumentNode<UnlinkContentMutation, UnlinkContentMutationVariables>;
export const RemoveContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveContentMutation, RemoveContentMutationVariables>;
export const ChangeAuthLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"changeAuthLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Auth"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeAuthLevel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"authLv"},"value":{"kind":"Variable","name":{"kind":"Name","value":"authLv"}}}]}]}}]} as unknown as DocumentNode<ChangeAuthLevelMutation, ChangeAuthLevelMutationVariables>;
export const LinkContentsDatasourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"linkContentsDatasource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasources"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDatasourceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkContentsDatasource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentsDatasources"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasources"}}}]}]}}]} as unknown as DocumentNode<LinkContentsDatasourceMutation, LinkContentsDatasourceMutationVariables>;
export const UnlinkContentsDatasourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unlinkContentsDatasource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasourceIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkContentsDatasource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentsDatasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentsDatasourceIds"}}}]}]}}]} as unknown as DocumentNode<UnlinkContentsDatasourceMutation, UnlinkContentsDatasourceMutationVariables>;
export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"datasourceIds"}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;
export const GetEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"dates"}}]}}]}}]} as unknown as DocumentNode<GetEventQuery, GetEventQueryVariables>;
export const GetItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"wkt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"wkt"}}},{"kind":"Argument","name":{"kind":"Name","value":"zoom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"zoom"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"latestEditedTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latestEditedTime"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeItemIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeItemIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geoJson"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"hasContents"}},{"kind":"Field","name":{"kind":"Name","value":"hasImageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"temporary"}}]}}]}}]} as unknown as DocumentNode<GetItemsQuery, GetItemsQueryVariables>;
export const GetItemsByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getItemsById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getItemsById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targets"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targets"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geoJson"}},{"kind":"Field","name":{"kind":"Name","value":"geoProperties"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedTime"}},{"kind":"Field","name":{"kind":"Name","value":"hasContents"}},{"kind":"Field","name":{"kind":"Name","value":"hasImageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"temporary"}}]}}]}}]} as unknown as DocumentNode<GetItemsByIdQuery, GetItemsByIdQueryVariables>;
export const GetContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentQuery, GetContentQueryVariables>;
export const GetContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentsQuery, GetContentsQueryVariables>;
export const GetContentsInItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getContentsInItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContentsInItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"content"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ContentsDefine"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"videoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"usingAnotherMap"}},{"kind":"Field","name":{"kind":"Name","value":"anotherMapItemId"}},{"kind":"Field","name":{"kind":"Name","value":"isSnsContent"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isDeletable"}}]}}]} as unknown as DocumentNode<GetContentsInItemQuery, GetContentsInItemQueryVariables>;
export const GetUnpointContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUnpointContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUnpointContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"datasourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nextToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nextToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"thumb"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextToken"}}]}}]}}]} as unknown as DocumentNode<GetUnpointContentsQuery, GetUnpointContentsQueryVariables>;
export const GetThumbDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getThumb"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"size"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ThumbSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getThumb"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"size"}}}]}]}}]} as unknown as DocumentNode<GetThumbQuery, GetThumbQueryVariables>;
export const GetImageUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getImageUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getImageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}}]}]}}]} as unknown as DocumentNode<GetImageUrlQuery, GetImageUrlQueryVariables>;
export const SearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Condition"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"datasourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"datasourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hitContents"}}]}}]}}]} as unknown as DocumentNode<SearchQuery, SearchQueryVariables>;
export const GetUserListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"authLv"}}]}}]}}]} as unknown as DocumentNode<GetUserListQuery, GetUserListQueryVariables>;
export const GetLinkableContentsDatasourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getLinkableContentsDatasources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"datasourceId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetLinkableContentsDatasourcesQuery, GetLinkableContentsDatasourcesQueryVariables>;