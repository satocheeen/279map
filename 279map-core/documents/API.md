# API References

## API

| Name | Type | Required | Description |
| ---- | ---- | ---- | ---- |
| mapId | string | * | Sets the connecting mapId or mapAlias |
| mapServerHost | string | * | Sets the map server host |
| iconDefine | [IconDefine](#icondefine)[] |  | Sets the icons defines using in the map.  If not set, a simple pin icon is used. |
| disabledPopup | boolean | | Sets the `true` if you want not to show popup on the map |
| filter | FilterDefine[] | | Sets filter conditions, filter items on the map |
| onConnect | (result: [MapDefine](#mapdefined), command: [Command](#command)) => void | | Callback fired when connecting map success |
| onSelect | (selectedIds: string[]) => void | | Callback fired when the pins selected |
| onUnselect | () => void | | Callback fired when the pins unselected |
| onClick | () => void | | Callback fired when a pin clicked |
| onModeChanged | (mode: MapMode) => void | | Callback fired when map mode has changed. |
| onCategoriesLoaded | (categories: CategoriDefine[]) => void | | Callback fired when categories has loaded or changed. |
| onEventsLoaded | (events: EventDefine[]) => void | | Callback fired when events has loaded or changed. |

## Type
### IconDefine
| Name | Type | Description |
| ---- | ---- | ---- |
| id | string | 'default' | the icon id. when 'default', you can use default icon. |
| imagePath | string | the url of the icon. if 'default', you don't need set imagePath. |
| useMaps | ('Real' \| 'Virtual')[] | the map kinds using the icon |

### MapDefine
| Name | Type | Description |
| ---- | ---- | ---- |
| mapId | string | map's id |
| name | string | map's name |
| useMaps | ('Real' \| 'Virtual')[] | the map kinds the map has |
| defaultMapKind | 'Real' \| 'Virtual' | if you don't set mapKind, the map kind is used |
| authLv | 'View' \| 'Edit' | the user's access level. |

### CommandHook
You can operate the map or access map's API by the command hook which is returned when `onConnect`.
| Name | Param | Return | Description |
| ---- | ---- | ---- | ---- |
| login ||| login or signup |
| logout ||| logout. if the showing map is private, redirect to login page. |
| switchMapKind | 'Real' \| 'Virtual' | | switch map kind |
| focusItem | itemId: string | | focus item on the map |
| registContentAPI | RegistContentParam | | regist a new content |
| updateContentAPI | UpdateContentParam | | update the content |
| linkContentToItemAPI | LinkContentToItemParam | | link the content to the item |
| getSnsPreviewAPI | url: string | sns info | get sns preview info |

