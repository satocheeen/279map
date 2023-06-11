import { CategoryDefine, ContentsDefine, DataId, DataSourceGroup, DataSourceInfo, EventDefine, ItemContentInfo, ItemDefine } from '279map-common';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Extent } from 'ol/extent';
import { SystemIconDefine } from '../../types/types';
import { loadMapDefine } from '../session/sessionThunk';
import { loadCategories, loadContents, loadEvents, loadItems, loadOriginalIconDefine, removeContent } from './dataThunk';
import { getMapKey, isEqualId } from './dataUtility';

/**
 * 地図関連の情報を管理
 */
const dataSlice = createSlice({
    name: 'data',
    initialState: {
        extent: undefined as Extent | undefined,
        itemMap: {} as {[id: string]: ItemDefine},

        // ロード済みのコンテンツ情報
        contentsList: [] as ContentsDefine[],

        categories: [] as CategoryDefine[],
        events: [] as EventDefine[],    // イベント（日付を持つデータ）情報

        originalIconDefine: [] as SystemIconDefine[],   // DBに登録されたオリジナルアイコン

        dataSourceGroups: [] as DataSourceGroup[],
    },
    reducers: {
        /**
         * アイテム削除
         * @param 削除対象のアイテムID
         */
        removeItems(state, action: PayloadAction<DataId[]>) {
            if (action.payload.length === 0) {
                return;
            }
            const itemMap = Object.assign({}, state.itemMap);
            action.payload.forEach(def => {
                delete itemMap[getMapKey(def)];
            });
            state.itemMap = itemMap;

            // contentsから除去
            state.contentsList = state.contentsList.filter(content => {
                const isDeleted = action.payload.some(id => isEqualId(content.itemId, id));
                return !isDeleted;
            });

            // eventから除去
            state.events = state.events.filter(event => {
                const isDeleted = action.payload.some(id => isEqualId(event.item_id, id));
                return !isDeleted;
            });

        },
        updateContents(state, action: PayloadAction<ContentsDefine[]>) {
            console.log('updateContents', action.payload);
            state.contentsList = action.payload;
            // const contentsMap = Object.assign({}, state.contentsMap);
            // action.payload.forEach(def => {
            //     const itemContents = contentsMap[def.itemId] ? contentsMap[def.itemId].concat() : [];
            //     const index = itemContents.findIndex(ic => ic.id === def.id);
            //     if (index === -1) {
            //         itemContents.push(def);
            //     } else {
            //         itemContents.splice(index, 1, def);
            //     }
            //     contentsMap[def.itemId] = itemContents;
            // });
            // state.contentsMap = contentsMap;
            // console.log('contentsMap', contentsMap);
        },
        updateDatasourceVisible(state, action: PayloadAction<{target: { dataSourceId: string } | { group: string }, visible: boolean}>) {
            state.dataSourceGroups = state.dataSourceGroups.map(group => {
                const visible = ('group' in action.payload.target && action.payload.target.group === group.name) ? action.payload.visible : group.visible;
                return {
                    name: group.name,
                    dataSources: group.dataSources.map((ds): DataSourceInfo => {
                        const dsVisible = ('dataSourceId' in action.payload.target && action.payload.target.dataSourceId === ds.dataSourceId) ? action.payload.visible : ds.visible;
                        return Object.assign({}, ds, {
                            visible: dsVisible,
                        });
                    }),
                    visible,
                }
            })
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            if (action.payload.result === 'failure') {
                return;
            }
            // state.mapKind = action.payload.mapKind;
            state.extent = action.payload.mapInfo.extent;
            state.dataSourceGroups = action.payload.mapInfo.dataSourceGroups;

            // アイテムクリア
            state.itemMap = {};
            state.contentsList = [];
            state.events = [];
        })
        .addCase(loadOriginalIconDefine.fulfilled, (state, action) => {
            const originalDefines = action.payload.map(def => {
                return {
                    type: 'original',
                    id: def.id,
                    caption: def.caption,
                    imagePath: def.imagePath,
                    useMaps: def.useMaps,
                } as SystemIconDefine;
            })
            state.originalIconDefine = originalDefines;
        })
        .addCase(loadEvents.fulfilled, (state, action) => {
            const newEvents = state.events.concat();
            action.payload.forEach(event => {
                const index = newEvents.findIndex(currentEvent => isEqualId(currentEvent.content_id, event.content_id));
                if (index !== -1) {
                    // 既に存在するものは、新しいものに差し替え
                    newEvents[index] = event;
                } else {
                    // 存在しないものは追加
                    newEvents.push(event);
                }
            })
            state.events = newEvents;
        })
        .addCase(loadCategories.fulfilled, (state, action) => {
            state.categories = action.payload;
        })
        .addCase(loadItems.fulfilled, (state, action) => {
            if (action.payload.length === 0) {
                return;
            }
            const itemMap = Object.assign({}, state.itemMap);
            action.payload.forEach(def => {
                itemMap[getMapKey(def.id)] = def;
            });
            state.itemMap = itemMap;
        })
        .addCase(loadContents.fulfilled, (state, action) => {
            // 既存コンテンツの中に新しく取得したものが存在する場合は除去する
            let newContentsList = state.contentsList.filter(content => {
                return !action.payload.contents.some(newContent => isEqualId(newContent.id, content.id));
            });

            // 末尾に追加
            newContentsList = newContentsList.concat(action.payload.contents);

            // 50件以上存在する場合は、メモリ節約のため過去に保持したものは除去する
            if (newContentsList.length > 50) {
                newContentsList = newContentsList.slice(newContentsList.length - 50);
            }
            state.contentsList = newContentsList;
        })
        .addCase(removeContent.fulfilled, (state, action) => {
            // 削除されたコンテンツはコンテンツ一覧から除去する
            state.contentsList = state.contentsList.filter(content => {
                return !(
                    (content.id.id === action.payload.id.id && content.id.dataSourceId === action.payload.id.dataSourceId) 
                    && (content.itemId.id === action.payload.itemId.id && content.itemId.dataSourceId === action.payload.itemId.dataSourceId));
            });
            // アイテムからも除去
            const itemMap = Object.assign({}, state.itemMap);
            const targetItem = itemMap[getMapKey(action.payload.itemId)];
            if (targetItem.contents.length>0) {
                let newContents: ItemContentInfo[];
                if (targetItem.contents.some(c => c.id === action.payload.id)) {
                    newContents = [];
                } else {
                    const removeChild = (children: ItemContentInfo[]): ItemContentInfo[] => {
                        const newChildren = [] as ItemContentInfo[];
                        for (const child of children) {
                            if (child.id === action.payload.id) {
                                continue;
                            }
                            const myNewChildren = removeChild(child.children);
                            newChildren.push({
                                id: child.id,
                                hasImage: child.hasImage,
                                children: myNewChildren,
                            });
                        };
                        return newChildren;
                    }
                    const newChildren = removeChild(targetItem.contents);
                    newContents = newChildren;
                }
                itemMap[getMapKey(action.payload.itemId)] = {
                    id: targetItem.id,
                    name: targetItem.name,
                    contents: newContents,
                    geoJson: targetItem.geoJson,
                    geoProperties: targetItem.geoProperties,
                    lastEditedTime: targetItem.lastEditedTime,
                }
            }
            state.itemMap = itemMap;

            // eventから除去
            state.events = state.events.filter(event => {
                return !isEqualId(event.content_id, action.payload.id);
            });

            // categoryから除去
            state.categories = state.categories.map(category => {
                return Object.assign({}, category, {
                    content_ids: category.content_ids.filter(content_id => {
                        return !isEqualId(content_id, action.payload.id);
                    })
                });
            }).filter(category => category.content_ids.length > 0);
        })
      },
})

export const dataActions = dataSlice.actions;
export const dataReducer = dataSlice.reducer;
