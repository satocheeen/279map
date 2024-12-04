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
    "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n      originalIcons\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nmutation registData($datasourceId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput, $linkDatas: [RegistDataLinkDataInput!]) {\n  registData(\n    datasourceId: $datasourceId\n    item: $item\n    contents: $contents\n    linkDatas: $linkDatas\n  )\n}\n\nmutation updateData($id: DataId!, $item: RegistDataItemInput, $deleteItem: Boolean, $contents: ContentValueMapInput) {\n  updateData(id: $id, item: $item, deleteItem: $deleteItem, contents: $contents)\n}\n\nmutation updateDataByOriginalId($originalId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput) {\n  updateDataByOriginalId(\n    originalId: $originalId\n    item: $item\n    contents: $contents\n  )\n}\n\nmutation removeData($id: DataId!) {\n  removeData(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}": types.ConnectDocument,
    "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    authLv\n    name\n    description\n    thumbnail\n  }\n}\n\nquery getMapMetaInfo($mapId: ID!) {\n  getMapMetaInfo(mapId: $mapId) {\n    mapId\n    title\n    description\n    keyword\n    image\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    datasourceId\n    fieldKey\n    categories {\n      value\n      color\n    }\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [DataId!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    id\n    datasourceId\n    values\n    backlinks {\n      itemId\n      itemName\n    }\n    usingOtherMap\n    readonly\n  }\n}\n\nquery getThumb($contentId: DataId!) {\n  getThumb(contentId: $contentId)\n}\n\nquery getImage($imageId: Int!, $size: ThumbSize!) {\n  getImage(imageId: $imageId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds)\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}": types.ConfigDocument,
    "subscription datasourceUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  datasourceUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nsubscription dataInsertInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataInsertInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataDeleteInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataDeleteInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription dataUpdate($id: DataId!) {\n  dataUpdate(id: $id)\n}\n\nsubscription categoryUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  categoryUpdateInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}": types.DatasourceUpdateInTheMapDocument,
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
export function graphql(source: "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n      originalIcons\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nmutation registData($datasourceId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput, $linkDatas: [RegistDataLinkDataInput!]) {\n  registData(\n    datasourceId: $datasourceId\n    item: $item\n    contents: $contents\n    linkDatas: $linkDatas\n  )\n}\n\nmutation updateData($id: DataId!, $item: RegistDataItemInput, $deleteItem: Boolean, $contents: ContentValueMapInput) {\n  updateData(id: $id, item: $item, deleteItem: $deleteItem, contents: $contents)\n}\n\nmutation updateDataByOriginalId($originalId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput) {\n  updateDataByOriginalId(\n    originalId: $originalId\n    item: $item\n    contents: $contents\n  )\n}\n\nmutation removeData($id: DataId!) {\n  removeData(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}"): (typeof documents)["mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        contentsSortCondition\n        options\n      }\n      originalIcons\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nmutation registData($datasourceId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput, $linkDatas: [RegistDataLinkDataInput!]) {\n  registData(\n    datasourceId: $datasourceId\n    item: $item\n    contents: $contents\n    linkDatas: $linkDatas\n  )\n}\n\nmutation updateData($id: DataId!, $item: RegistDataItemInput, $deleteItem: Boolean, $contents: ContentValueMapInput) {\n  updateData(id: $id, item: $item, deleteItem: $deleteItem, contents: $contents)\n}\n\nmutation updateDataByOriginalId($originalId: String!, $item: RegistDataItemInput, $contents: ContentValueMapInput) {\n  updateDataByOriginalId(\n    originalId: $originalId\n    item: $item\n    contents: $contents\n  )\n}\n\nmutation removeData($id: DataId!) {\n  removeData(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    authLv\n    name\n    description\n    thumbnail\n  }\n}\n\nquery getMapMetaInfo($mapId: ID!) {\n  getMapMetaInfo(mapId: $mapId) {\n    mapId\n    title\n    description\n    keyword\n    image\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    datasourceId\n    fieldKey\n    categories {\n      value\n      color\n    }\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [DataId!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    id\n    datasourceId\n    values\n    backlinks {\n      itemId\n      itemName\n    }\n    usingOtherMap\n    readonly\n  }\n}\n\nquery getThumb($contentId: DataId!) {\n  getThumb(contentId: $contentId)\n}\n\nquery getImage($imageId: Int!, $size: ThumbSize!) {\n  getImage(imageId: $imageId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds)\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"): (typeof documents)["query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    authLv\n    name\n    description\n    thumbnail\n  }\n}\n\nquery getMapMetaInfo($mapId: ID!) {\n  getMapMetaInfo(mapId: $mapId) {\n    mapId\n    title\n    description\n    keyword\n    image\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    datasourceId\n    fieldKey\n    categories {\n      value\n      color\n    }\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    itemDatasourceId\n    contents {\n      id\n      date\n    }\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [DataId!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getItemsById($targets: [DataId!]!) {\n  getItemsById(targets: $targets) {\n    id\n    datasourceId\n    name\n    geometry\n    geoProperties\n    lastEditedTime\n    content {\n      id\n      datasourceId\n      hasValue\n      hasImage\n      linkedContents {\n        id\n        datasourceId\n        hasValue\n        hasImage\n      }\n    }\n  }\n}\n\nquery getContent($id: DataId!) {\n  getContent(id: $id) {\n    id\n    datasourceId\n    values\n    backlinks {\n      itemId\n      itemName\n    }\n    usingOtherMap\n    readonly\n  }\n}\n\nquery getThumb($contentId: DataId!) {\n  getThumb(contentId: $contentId)\n}\n\nquery getImage($imageId: Int!, $size: ThumbSize!) {\n  getImage(imageId: $imageId, size: $size)\n}\n\nquery getImageUrl($contentId: DataId!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds)\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo\n    name\n    geometry\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInfo!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription datasourceUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  datasourceUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nsubscription dataInsertInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataInsertInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataDeleteInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataDeleteInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription dataUpdate($id: DataId!) {\n  dataUpdate(id: $id)\n}\n\nsubscription categoryUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  categoryUpdateInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}"): (typeof documents)["subscription datasourceUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  datasourceUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    itemDataSources {\n      datasourceId\n      name\n      groupName\n      initialVisible\n      unclickable\n      config\n    }\n    contentDataSources {\n      datasourceId\n      name\n      config\n    }\n  }\n}\n\nsubscription dataInsertInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataInsertInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataUpdateInTheMap(mapId: $mapId, mapKind: $mapKind) {\n    id\n    datasourceId\n    hasItem\n    hasContent\n    wkt\n  }\n}\n\nsubscription dataDeleteInTheMap($mapId: String!, $mapKind: MapKind!) {\n  dataDeleteInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription dataUpdate($id: DataId!) {\n  dataUpdate(id: $id)\n}\n\nsubscription categoryUpdateInTheMap($mapId: String!, $mapKind: MapKind!) {\n  categoryUpdateInTheMap(mapId: $mapId, mapKind: $mapKind)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}\n\nsubscription error($sid: String!) {\n  error(sid: $sid) {\n    type\n    description\n    itemId\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;