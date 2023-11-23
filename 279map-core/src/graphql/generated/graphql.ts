/* eslint-disable */
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
};

export type CategoryDefine = {
  __typename?: 'CategoryDefine';
  color: Scalars['String']['output'];
  dataSourceIds: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export enum ContentType {
  Normal = 'normal',
  Sns = 'sns'
}

export type DataId = {
  __typename?: 'DataId';
  dataSourceId: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

export type DataIdInput = {
  dataSourceId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};

export type EventDefine = {
  __typename?: 'EventDefine';
  dataSourceId?: Maybe<Scalars['String']['output']>;
  dates: Array<Scalars['String']['output']>;
};

export type ItemDefine = {
  __typename?: 'ItemDefine';
  id: DataId;
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  updateContent?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationUpdateContentArgs = {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  date?: InputMaybe<Scalars['String']['input']>;
  id: DataIdInput;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: ContentType;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  getCategory: Array<CategoryDefine>;
  getEvent: Array<EventDefine>;
  getItems?: Maybe<Array<Maybe<ItemDefine>>>;
  hello?: Maybe<Scalars['String']['output']>;
};


export type QueryGetCategoryArgs = {
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
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

export type UpdateContentMutationVariables = Exact<{
  id: DataIdInput;
  title?: InputMaybe<Scalars['String']['input']>;
  overview?: InputMaybe<Scalars['String']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  type: ContentType;
  date?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateContentMutation = { __typename?: 'Mutation', updateContent?: boolean | null };

export type GetCategoryQueryVariables = Exact<{
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory: Array<{ __typename?: 'CategoryDefine', name: string, color: string, dataSourceIds: Array<string> }> };

export type GetEventQueryVariables = Exact<{
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetEventQuery = { __typename?: 'Query', getEvent: Array<{ __typename?: 'EventDefine', dataSourceId?: string | null, dates: Array<string> }> };


export const UpdateContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataIdInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"overview"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categories"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ContentType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"overview"},"value":{"kind":"Variable","name":{"kind":"Name","value":"overview"}}},{"kind":"Argument","name":{"kind":"Name","value":"categories"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categories"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"imageUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}]}}]} as unknown as DocumentNode<UpdateContentMutation, UpdateContentMutationVariables>;
export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceIds"}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;
export const GetEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"dates"}}]}}]}}]} as unknown as DocumentNode<GetEventQuery, GetEventQueryVariables>;