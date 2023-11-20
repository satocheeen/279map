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

export type DataId = {
  __typename?: 'DataId';
  dataSourceId: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

export type ItemDefine = {
  __typename?: 'ItemDefine';
  id: DataId;
  lastEditedTime: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  getCategory?: Maybe<Array<Maybe<CategoryDefine>>>;
  getItems?: Maybe<Array<Maybe<ItemDefine>>>;
  hello?: Maybe<Scalars['String']['output']>;
};


export type QueryGetCategoryArgs = {
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetItemsArgs = {
  dataSourceId: Scalars['String']['input'];
  excludeItemIds?: InputMaybe<Array<Scalars['String']['input']>>;
  latestEditedTime?: InputMaybe<Scalars['String']['input']>;
  wkt: Scalars['String']['input'];
  zoom: Scalars['Float']['input'];
};

export type GetCategoryQueryVariables = Exact<{
  dataSourceIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetCategoryQuery = { __typename?: 'Query', getCategory?: Array<{ __typename?: 'CategoryDefine', name: string } | null> | null };


export const GetCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetCategoryQuery, GetCategoryQueryVariables>;