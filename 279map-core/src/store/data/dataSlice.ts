import { CategoryDefine, ContentsDefine, EventDefine, ItemContentInfo, ItemDefine, MapKind } from '279map-common';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Extent } from 'ol/extent';
import { SystemIconDefine } from '../../types/types';
import { loadMapDefine } from '../session/sessionThunk';
import { loadCategories, loadContents, loadEvents, loadItems, loadOriginalIconDefine, removeContent } from './dataThunk';

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
    },
    reducers: {
        /**
         * アイテム削除
         * @param 削除対象のアイテムID
         */
        removeItems(state, action: PayloadAction<string[]>) {
            if (action.payload.length === 0) {
                return;
            }
            const itemMap = Object.assign({}, state.itemMap);
            action.payload.forEach(def => {
                delete itemMap[def];
            });
            state.itemMap = itemMap;
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
    },
    extraReducers: (builder) => {
        builder
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            // state.mapKind = action.payload.mapKind;
            state.extent = action.payload.extent;

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
            state.events = action.payload;
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
                itemMap[def.id] = def;
            });
            state.itemMap = itemMap;
        })
        .addCase(loadContents.fulfilled, (state, action) => {
            if (action.payload.keepCurrentData) {
                // 既存コンテンツを残す
                const replaceData = state.contentsList.map(content => {
                    const newContent = action.payload.contents.find(c => c.id === content.id);
                    if (newContent) {
                        return newContent;
                    } else {
                        return content;
                    }
                });
                const newData = action.payload.contents.filter(content => {
                    const exist = state.contentsList.some(c => c.id === content.id);
                    return !exist;
                });
                state.contentsList = replaceData.concat(newData);
            } else {
                // 既存コンテンツを残さない
                state.contentsList = action.payload.contents;
            }
        })
        .addCase(removeContent.fulfilled, (state, action) => {
            // 削除されたコンテンツはコンテンツ一覧から除去する
            state.contentsList = state.contentsList.filter(content => {
                return !(content.id === action.payload.id && content.itemId === action.payload.itemId);
            });
            // アイテムからも除去
            const itemMap = Object.assign({}, state.itemMap);
            const targetItem = itemMap[action.payload.itemId];
            if (targetItem.contents) {
                let newContents = null as null | ItemContentInfo;
                if (targetItem.contents.id === action.payload.id) {
                    newContents = null;
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
                    const newChildren = removeChild(targetItem.contents.children);
                    newContents = Object.assign({}, targetItem.contents, {
                        children: newChildren,
                    });
                }
                itemMap[action.payload.itemId] = {
                    id: targetItem.id,
                    name: targetItem.name,
                    contents: newContents,
                    position: targetItem.position,
                    geoProperties: targetItem.geoProperties,
                    lastEditedTime: targetItem.lastEditedTime,
                }
        }
            state.itemMap = itemMap;

        })
      },
})

export const dataActions = dataSlice.actions;
export const dataReducer = dataSlice.reducer;
