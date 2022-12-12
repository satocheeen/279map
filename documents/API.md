# API References

## API

| Name | Type | Required | Description |
| ---- | ---- | ---- | ---- |
| mapId | string | * | Sets the connecting mapId or mapAlias |
| mapServerHost | string | * | Sets the map server host |
| iconDefine | [IconDefine](#icondefine)[] |  | Sets the icons defines using in the map.  If not set, a simple pin icon is used. |
| mapKind | 'Real' \| 'Virtual' | | Sets the show map kind.  If not set, the default map which is map manager selected kind is shown. |
| disabledPopup | boolean | | Sets the `true` if you want not to show popup on the map |
| filter | FilterDefine[] | | Sets filter conditions, filter items on the map |
| onConnect | (result: [ConnectResult](#connectresult)) => void | | Callback fired when connecting map success |
| onSelect | (selectedIds: string[]) => void | | Callback fired when the pins selected |
| onUnselect | () => void | | Callback fired when the pins unselected |
| onModeChanged | (mode: MapMode) => void | | Callback fired when map mode has changed. |
| onCategoriesLoaded | (categories: CategoriDefine[]) => void | | Callback fired when categories has loaded or changed. |

## Type
### IconDefine
| Name | Type | Description |
| ---- | ---- | ---- |
| id | string | the icon id |
| imagePath | string | the url of the icon |
| useMaps | ('Real' \| 'Virtual')[] | the map kinds using the icon |

### ConnectResult
| Name | Type | Description |
| ---- | ---- | ---- |
| mapId | string | map's id |
| name | string | map's name |
| useMaps | ('Real' \| 'Virtual')[] | the map kinds the map has |
| defaultMapKind | 'Real' \| 'Virtual' | if you don't set mapKind, the map kind is used |
| authLv | 'View' \| 'Edit' | the user's access level. |
