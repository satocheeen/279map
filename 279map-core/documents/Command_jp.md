# Commandリファレンス
`TsunaguMap`にrefを設定することで、地図に対して以下の操作を行うことができます。

## switchMapKind
指定の地図種別に切り替えます.

| Name | Type | Description |
| ---- | ---- | ---- |
 |mapKind | 'Real' \| 'Virtual' | 切り替える地図種別 |

## focusItem
地図上の指定のアイテムにフォーカスします。

| Name | Type | Description |
| ---- | ---- | ---- |
| itemId | DataId | フォーカスするアイテムid | 
| opts | | フォーカスする際のオプション（任意） |
| - zoom | boolean | true->対象のアイテムにズームする。false->ズームLv.を変更しない。（デフォルト=true）|

## confirm
確認ダイアログを表示します。

| Name | Type | Description |
| ---- | ---- | ---- |
| param | ConfirmParam | 確認ダイアログに表示する内容 |

## drawStructure
アイテム描画操作を起動します。

| Name | Type | Description |
| ---- | ---- | ---- |
| dataSourceId | string | 描画したアイテムを登録するデータソースid |

## moveStructure
アイテム移動操作を起動します。

## editItem
アイテム編集操作を起動します。

| Name | Type | Description |
| ---- | ---- | ---- |
| targets | FeatureType[] | 編集対象のアイテム種別 |


## removeItem
アイテム削除操作を起動します。

| Name | Type | Description |
| ---- | ---- | ---- |
| targets | FeatureType[] | 削除対象のアイテム種別 |

## drawTopography
土地描画操作を起動します。

| Name | Type | Description |
| ---- | ---- | ---- |
| dataSourceId | string | 描画したアイテムを登録するデータソースid |
| featureType | 'EARTH' \| 'FOREST' \| 'AREA' | 描画するアイテム種別 |

## drawRoad
道描画操作を起動します。

| Name | Type | Description |
| ---- | ---- | ---- |
| dataSourceId | string | 描画したアイテムを登録するデータソースid |

## editTopographyInfo
土地情報編集操作を起動します。

## drawTemporaryFeature
ユーザに指定の種別のFeatureを描画させて、その結果を返します。
現状は、Pointのみ対応。

## loadContents
指定のコンテンツ情報を取得します。
| Name | Type | Description |
| ---- | ---- | ---- |
| param | LoadContentsParam | |

### Returns:
`Promise\<LoadContentsResult\>` コンテンツ情報

## showDetailDialog
指定のコンテンツまたはアイテムの詳細情報をダイアログ表示します。
| Name | Type | Description |
| ---- | ---- | ---- |
| type | 'item' \| 'content' | 表示対象 |
| id | DataId | アイテムID または コンテンツID |

## registContent
新規コンテンツを登録します。
| Name | Type | Description |
| ---- | ---- | ---- |
| param | RegistContentParam | 登録するコンテンツ情報 |

## updateContent
指定のコンテンツを更新します。
| Name | Type | Description |
| ---- | ---- | ---- |
| param | UpdateContentParam | 更新するコンテンツ情報 | 

## linkContentToItemAPI
既存コンテンツを割り当てます。
| Name | Type | Description |
| ---- | ---- | ---- |
| param | LinkContentToItemParam | 割り当てるコンテンツ情報 |

## getSnsPreviewAPI
SNSのプレビュー情報を取得します。
| Name | Type | Description |
| ---- | ---- | ---- |
| url | string | SNSのURL |

### Returns
SNSプレビュー情報

## getUnpointDataAPI
未割当コンテンツ情報を取得します。
| Name | Type | Description |
| ---- | ---- | ---- |
| dataSourceId | string | 取得対象コンテンツのデータソースid |
| nextToken? | string | 件数が多い場合に続きを取得する場合に指定 |

### Returns
| Name | Type | Description |
| ---- | ---- | ---- |
| contents | UnpointContent[] | 未割当コンテンツ情報 |
| nextToken | string \| undefined | 続きが存在する場合、続きを取得するためのトークン |

## getThumbnail
指定のコンテンツのサムネイル画像（Blob）を取得します。
| Name | Type | Description |
| ---- | ---- | ---- |
| contentId | DataId | 対象のコンテンツid |

### Returns
サムネイル画像（Blob）
