/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "mutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}": types.UpdateContentDocument,
    "query getCategory($dataSourceIds: [String!]) {\n  getCategory(dataSourceIds: $dataSourceIds) {\n    name\n    color\n    dataSourceIds\n  }\n}\n\nquery getEvent($dataSourceIds: [String!]) {\n  getEvent(dataSourceIds: $dataSourceIds) {\n    dataSourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}": types.GetCategoryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}"): (typeof documents)["mutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query getCategory($dataSourceIds: [String!]) {\n  getCategory(dataSourceIds: $dataSourceIds) {\n    name\n    color\n    dataSourceIds\n  }\n}\n\nquery getEvent($dataSourceIds: [String!]) {\n  getEvent(dataSourceIds: $dataSourceIds) {\n    dataSourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}"): (typeof documents)["query getCategory($dataSourceIds: [String!]) {\n  getCategory(dataSourceIds: $dataSourceIds) {\n    name\n    color\n    dataSourceIds\n  }\n}\n\nquery getEvent($dataSourceIds: [String!]) {\n  getEvent(dataSourceIds: $dataSourceIds) {\n    dataSourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;