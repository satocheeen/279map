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
    "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nfragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon {\n        type\n        id\n      }\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: JSON!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItem($targets: [UpdateItemInput!]!) {\n  updateItem(targets: $targets)\n}\n\nmutation removeItem($id: DataIdInput!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataIdInput!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataIdInput!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataIdInput!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataIdInput!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}": types.ConnectDocument,
    "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nfragment geocoderIdInfo on GeocoderIdInfo {\n  ... on GeocoderIdMapbox {\n    id\n  }\n  ... on GeocoderIdOsm {\n    osm_type\n    osm_id\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getItemsById($targets: [DataIdInput!]!) {\n  getItemsById(targets: $targets) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getContent($id: DataIdInput!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataIdInput!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataIdInput!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id {\n    id\n    dataSourceId\n  }\n  itemId {\n    id\n    dataSourceId\n  }\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId {\n    id\n    dataSourceId\n  }\n  usingAnotherMap\n  anotherMapItemId {\n    id\n    dataSourceId\n  }\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id {\n        id\n        dataSourceId\n      }\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataIdInput!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataIdInput!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id {\n      id\n      dataSourceId\n    }\n    hitContents {\n      id\n      dataSourceId\n    }\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo {\n      ...geocoderIdInfo\n    }\n    name\n    geoJson\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInput!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}": types.ConfigDocument,
    "subscription test {\n  test {\n    message\n  }\n}\n\nsubscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind) {\n    id\n    dataSourceId\n  }\n}\n\nsubscription childContentsUpdate($itemId: DataIdInput!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}": types.TestDocument,
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
export function graphql(source: "mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nfragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon {\n        type\n        id\n      }\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: JSON!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItem($targets: [UpdateItemInput!]!) {\n  updateItem(targets: $targets)\n}\n\nmutation removeItem($id: DataIdInput!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataIdInput!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataIdInput!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataIdInput!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataIdInput!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"): (typeof documents)["mutation connect($mapId: String!) {\n  connect(mapId: $mapId) {\n    mapDefine {\n      name\n      useMaps\n      defaultMapKind\n      options {\n        popupMode\n        itemLabel\n        visibleDataSources {\n          ... on VisibleDataSourceDatasource {\n            dataSourceId\n          }\n          ... on VisibleDataSourceGroup {\n            group\n          }\n        }\n        guestUserAuthLevel\n        newUserAuthLevel\n        usePanels\n        options\n      }\n    }\n    connect {\n      sid\n      authLv\n      userId\n      userName\n    }\n  }\n}\n\nmutation disconnect {\n  disconnect\n}\n\nfragment datasourceInfo on DatasourceInfo {\n  datasourceId\n  name\n  visible\n  kind\n  config {\n    ... on ItemConfig {\n      layerGroup\n      editable\n      deletable\n    }\n    ... on RealPointContentConfig {\n      defaultIcon {\n        type\n        id\n      }\n      linkableContents\n      layerGroup\n      editable\n      deletable\n    }\n    ... on ContentConfig {\n      linkableChildContents\n      disableUnlinkMap\n      editable\n      deletable\n    }\n  }\n}\n\nmutation switchMapKind($mapKind: MapKind!) {\n  switchMapKind(mapKind: $mapKind) {\n    extent\n    itemDataSourceGroups {\n      name\n      visible\n      datasources {\n        ...datasourceInfo\n      }\n    }\n    contentDataSources {\n      ...datasourceInfo\n    }\n    originalIcons {\n      id\n      caption\n      imagePath\n      useMaps\n    }\n  }\n}\n\nmutation registItem($datasourceId: String!, $name: String, $geometry: Geometry!, $geoProperties: JSON!) {\n  registItem(\n    datasourceId: $datasourceId\n    name: $name\n    geometry: $geometry\n    geoProperties: $geoProperties\n  )\n}\n\nmutation updateItem($targets: [UpdateItemInput!]!) {\n  updateItem(targets: $targets)\n}\n\nmutation removeItem($id: DataIdInput!) {\n  removeItem(id: $id)\n}\n\nmutation registContent($parent: ParentInput!, $datasourceId: String!, $title: String!, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  registContent(\n    parent: $parent\n    datasourceId: $datasourceId\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation updateContent($id: DataIdInput!, $title: String, $overview: String, $categories: [String!], $type: ContentType!, $date: String, $imageUrl: String, $url: String) {\n  updateContent(\n    id: $id\n    title: $title\n    overview: $overview\n    categories: $categories\n    type: $type\n    date: $date\n    imageUrl: $imageUrl\n    url: $url\n  )\n}\n\nmutation linkContent($id: DataIdInput!, $parent: ParentInput!) {\n  linkContent(id: $id, parent: $parent)\n}\n\nmutation unlinkContent($id: DataIdInput!, $parent: ParentInput!) {\n  unlinkContent(id: $id, parent: $parent)\n}\n\nmutation removeContent($id: DataIdInput!) {\n  removeContent(id: $id)\n}\n\nmutation changeAuthLevel($userId: ID!, $authLv: Auth!) {\n  changeAuthLevel(userId: $userId, authLv: $authLv)\n}\n\nmutation request($mapId: String!, $name: String!) {\n  request(mapId: $mapId, name: $name)\n}\n\nmutation linkContentsDatasource($contentsDatasources: [ContentsDatasourceInput!]!) {\n  linkContentsDatasource(contentsDatasources: $contentsDatasources)\n}\n\nmutation unlinkContentsDatasource($contentsDatasourceIds: [String!]!) {\n  unlinkContentsDatasource(contentsDatasourceIds: $contentsDatasourceIds)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nfragment geocoderIdInfo on GeocoderIdInfo {\n  ... on GeocoderIdMapbox {\n    id\n  }\n  ... on GeocoderIdOsm {\n    osm_type\n    osm_id\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getItemsById($targets: [DataIdInput!]!) {\n  getItemsById(targets: $targets) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getContent($id: DataIdInput!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataIdInput!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataIdInput!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id {\n    id\n    dataSourceId\n  }\n  itemId {\n    id\n    dataSourceId\n  }\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId {\n    id\n    dataSourceId\n  }\n  usingAnotherMap\n  anotherMapItemId {\n    id\n    dataSourceId\n  }\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id {\n        id\n        dataSourceId\n      }\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataIdInput!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataIdInput!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id {\n      id\n      dataSourceId\n    }\n    hitContents {\n      id\n      dataSourceId\n    }\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo {\n      ...geocoderIdInfo\n    }\n    name\n    geoJson\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInput!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"): (typeof documents)["query config {\n  config {\n    ... on NoneConfig {\n      dummy\n    }\n    ... on Auth0Config {\n      domain\n      clientId\n      audience\n    }\n  }\n}\n\nquery getMapList {\n  getMapList {\n    mapId\n    name\n  }\n}\n\nquery getCategory($datasourceIds: [String!]) {\n  getCategory(datasourceIds: $datasourceIds) {\n    name\n    color\n    datasourceIds\n  }\n}\n\nquery getEvent($datasourceIds: [String!]) {\n  getEvent(datasourceIds: $datasourceIds) {\n    datasourceId\n    dates\n  }\n}\n\nfragment geocoderIdInfo on GeocoderIdInfo {\n  ... on GeocoderIdMapbox {\n    id\n  }\n  ... on GeocoderIdOsm {\n    osm_type\n    osm_id\n  }\n}\n\nquery getItems($wkt: String!, $zoom: Float!, $datasourceId: String!, $latestEditedTime: String, $excludeItemIds: [String!]) {\n  getItems(\n    wkt: $wkt\n    zoom: $zoom\n    datasourceId: $datasourceId\n    latestEditedTime: $latestEditedTime\n    excludeItemIds: $excludeItemIds\n  ) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getItemsById($targets: [DataIdInput!]!) {\n  getItemsById(targets: $targets) {\n    id {\n      id\n      dataSourceId\n    }\n    name\n    geoJson\n    geoProperties {\n      ... on StructurePropeties {\n        featureType\n        icon {\n          type\n          id\n        }\n      }\n      ... on RoadProperties {\n        featureType\n        lineJson\n        width\n      }\n      ... on CircleProperties {\n        featureType\n        radius\n      }\n      ... on GeocoderFeatureProperties {\n        featureType\n        geocoderIdInfo {\n          ...geocoderIdInfo\n        }\n      }\n      ... on TrackPropeties {\n        featureType\n        minZoom\n        maxZoom\n      }\n    }\n    lastEditedTime\n    hasContents\n    hasImageContentId {\n      id\n      dataSourceId\n    }\n    temporary\n  }\n}\n\nquery getContent($id: DataIdInput!) {\n  getContent(id: $id) {\n    ...content\n  }\n}\n\nquery getContents($ids: [DataIdInput!]!) {\n  getContents(ids: $ids) {\n    ...content\n  }\n}\n\nquery getContentsInItem($itemId: DataIdInput!) {\n  getContentsInItem(itemId: $itemId) {\n    ...content\n    children {\n      ...content\n    }\n  }\n}\n\nfragment content on ContentsDefine {\n  id {\n    id\n    dataSourceId\n  }\n  itemId {\n    id\n    dataSourceId\n  }\n  date\n  url\n  title\n  overview\n  category\n  image\n  videoUrl\n  parentId {\n    id\n    dataSourceId\n  }\n  usingAnotherMap\n  anotherMapItemId {\n    id\n    dataSourceId\n  }\n  isSnsContent\n  isEditable\n  isDeletable\n}\n\nquery getUnpointContents($datasourceId: String!, $nextToken: String) {\n  getUnpointContents(datasourceId: $datasourceId, nextToken: $nextToken) {\n    contents {\n      id {\n        id\n        dataSourceId\n      }\n      title\n      thumb\n      overview\n    }\n    nextToken\n  }\n}\n\nquery getThumb($contentId: DataIdInput!, $size: ThumbSize) {\n  getThumb(contentId: $contentId, size: $size)\n}\n\nquery getImageUrl($contentId: DataIdInput!) {\n  getImageUrl(contentId: $contentId)\n}\n\nquery search($condition: Condition!, $datasourceIds: [String!]) {\n  search(condition: $condition, datasourceIds: $datasourceIds) {\n    id {\n      id\n      dataSourceId\n    }\n    hitContents {\n      id\n      dataSourceId\n    }\n  }\n}\n\nquery geocoder($address: String!, $searchTarget: [GeocoderTarget!]!) {\n  geocoder(address: $address, searchTarget: $searchTarget) {\n    idInfo {\n      ...geocoderIdInfo\n    }\n    name\n    geoJson\n  }\n}\n\nquery getGeocoderFeature($id: GeocoderIdInput!) {\n  getGeocoderFeature(id: $id)\n}\n\nquery getSnsPreview($url: String!) {\n  getSnsPreview(url: $url) {\n    type\n    posts {\n      text\n      media {\n        type\n        url\n      }\n      date\n    }\n  }\n}\n\nquery getUserList {\n  getUserList {\n    id\n    name\n    authLv\n  }\n}\n\nquery getLinkableContentsDatasources {\n  getLinkableContentsDatasources {\n    datasourceId\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription test {\n  test {\n    message\n  }\n}\n\nsubscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind) {\n    id\n    dataSourceId\n  }\n}\n\nsubscription childContentsUpdate($itemId: DataIdInput!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}"): (typeof documents)["subscription test {\n  test {\n    message\n  }\n}\n\nsubscription itemInsert($mapId: String!, $mapKind: MapKind!) {\n  itemInsert(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemUpdate($mapId: String!, $mapKind: MapKind!) {\n  itemUpdate(mapId: $mapId, mapKind: $mapKind) {\n    id {\n      id\n      dataSourceId\n    }\n    wkt\n  }\n}\n\nsubscription itemDelete($mapId: String!, $mapKind: MapKind!) {\n  itemDelete(mapId: $mapId, mapKind: $mapKind) {\n    id\n    dataSourceId\n  }\n}\n\nsubscription childContentsUpdate($itemId: DataIdInput!) {\n  childContentsUpdate(itemId: $itemId)\n}\n\nsubscription updateUserAuth($userId: ID!, $mapId: String!) {\n  updateUserAuth(userId: $userId, mapId: $mapId)\n}\n\nsubscription userListUpdate($mapId: String!) {\n  userListUpdate(mapId: $mapId)\n}\n\nsubscription mapInfoUpdate($mapId: String!) {\n  mapInfoUpdate(mapId: $mapId)\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;