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
    "fragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}": types.DatasourceInfoFragmentDoc,
    "query getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}": types.GetCategoryDocument,
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
export function graphql(source: "fragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"): (typeof documents)["fragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"): (typeof documents)["query getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  itemId\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;