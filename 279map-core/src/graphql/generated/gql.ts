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
    "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: GeoProperties!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItems($targets: [UpdateItemInput!]!) {\n  updateItems(targets: $targets) {\n    success\n    error\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String, $deleteImage: Boolean) {\n  updateContent(\n    id: $id\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n    deleteImage: $deleteImage\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}": types.ConnectDocument,
    "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  url\n  title\n  image\n  parentId\n  values\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataId!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n    hitItem\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}": types.ConfigDocument,
    "subscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription childContentsUpdate($itemId: DataId!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}": types.ItemInsertDocument,
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
export function graphql(source: "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: GeoProperties!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItems($targets: [UpdateItemInput!]!) {\n  updateItems(targets: $targets) {\n    success\n    error\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String, $deleteImage: Boolean) {\n  updateContent(\n    id: $id\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n    deleteImage: $deleteImage\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"): (typeof documents)["mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: GeoProperties!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItems($targets: [UpdateItemInput!]!) {\n  updateItems(targets: $targets) {\n    success\n    error\n  }\n}\n\nmutation removeItem($id: DataId!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n  )\n}\n\nmutation updateContent($id: DataId!, $title: String, $values: ContentValueMap!, $type: ContentType!, $imageUrl: String, $deleteImage: Boolean) {\n  updateContent(\n    id: $id\n    title: $title\n    values: $values\n    type: $type\n    imageUrl: $imageUrl\n    deleteImage: $deleteImage\n  )\n}\n\nmutation linkContent($id: DataId!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataId!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataId!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  url\n  title\n  image\n  parentId\n  values\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataId!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n    hitItem\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"): (typeof documents)["query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    hasContents\n    hasImageContentId\n    contents {\n      id\n      image\n      children {\n        id\n        image\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataId!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataId!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id\n  url\n  title\n  image\n  parentId\n  values\n  usingAnotherMap\n  anotherMapItemId\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataId!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id\n    hitContents\n    hitItem\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription childContentsUpdate($itemId: DataId!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}"): (typeof documents)["subscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription childContentsUpdate($itemId: DataId!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;