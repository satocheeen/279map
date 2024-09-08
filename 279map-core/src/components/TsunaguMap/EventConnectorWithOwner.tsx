import React, { useContext, useCallback, useImperativeHandle, Suspense } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { mapModeAtom, selectItemIdAtom } from '../../store/operation';
import { currentMapDefineAtom, mapDefineAtom } from '../../store/session';
import { filteredDatasAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler, LoadContentsResult } from '../../types/types';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom, itemDatasourcesWithVisibleAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { overrideItemsAtom, showingItemsAtom, } from '../../store/item';
import { useMapController } from '../../store/map/useMapController';
import useDataSource, { ChangeVisibleLayerTarget } from '../../store/datasource/useDataSource';
import { ContentsDefine, GetUnpointContentsDocument, SearchDocument, SortCondition, GetImageDocument, UpdateDataDocument, LinkDataDocument, UnlinkDataDocument, GetContentDocument, DataUpdateDocument, Operation, LinkDataByOriginalIdDocument, UpdateDataByOriginalIdDocument, Condition } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import useConfirm from '../common/confirm/useConfirm';
import { ConfirmBtnPattern } from '../common/confirm/types';
import dayjs from 'dayjs';
import useItemProcess from '../../store/item/useItemProcess';
import { useAtomCallback } from 'jotai/utils';
import { DataId } from '../../entry';
import { ContentValueMapInput } from '../../types-common/common-types';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadContent' | 'loadImage'
    | 'filter' | 'clearFilter'
    | 'registData' | 'updateData'
    | 'linkContent' | 'unlinkContent'
    | 'getUnpointDataAPI'
    | 'changeVisibleLayer'
    | 'selectItem'
    | 'switchBackground'>

function EventConnectorWithOwner(props: {}, ref: React.ForwardedRef<EventControllerHandler>) {
    const { loadMap } = useMapController();
    const { map, focusItem, fitToDefaultExtent, loadCurrentAreaContents } = useMap();
    const { updateDatasourceVisible } = useDataSource();
    const [ gqlClient ] = useAtom(clientAtom);
    const [ , setFilteredItem ] = useAtom(filteredDatasAtom);
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    const { confirm } = useConfirm();
    const [ mapDefine ] = useAtom(mapDefineAtom);
    const [ , setSelectItemId ] = useAtom(selectItemIdAtom);
    const [ contentDatasources ] = useAtom(contentDataSourcesAtom);
    const { overrideItems } = useContext(OwnerContext);

    useWatch(overrideItems, 
        useAtomCallback(
            useCallback((get, set, oldVal, newVal) => {
                set(overrideItemsAtom, newVal ?? [])
            }, [])
        )
    , { immediate: true })

    /**
     * コンテンツ用comparator
     */
    // const contentsComparator = useCallback((a: ContentsDefine, b: ContentsDefine) => {
    //     const sortCondition = mapDefine?.options.contentsSortCondition ?? SortCondition.CreatedAtAsc;
    //     switch(sortCondition) {
    //         case SortCondition.DateAsc:
    //         case SortCondition.DateDesc:
    //             {

    //                 const aDateField = contentDatasources
    //                                     .find(c => c.datasourceId === a.datasourceId)?.config.fields
    //                                     .find(f => f.type === 'date');
    //                 const bDateField = contentDatasources
    //                     .find(c => c.datasourceId === b.datasourceId)?.config.fields
    //                     .find(f => f.type === 'date');
    //                 const aDate = aDateField ? a.values[aDateField.key] : undefined;
    //                 const bDate = bDateField ? b.values[bDateField.key] : undefined;
    //                 if (!aDate && !bDate) return 0;
    //                 if (!aDate) return 1;
    //                 if (!bDate) return -1;
    //                 const aVal = dayjs(aDate).valueOf();
    //                 const bVal = dayjs(bDate).valueOf();
    //                 return (sortCondition === SortCondition.DateAsc ? 1 : -1) * (aVal - bVal)
    //             }
    //     }
    //     return 0;
    // }, [mapDefine, contentDatasources]);

    const { registData: registDataProcess } = useItemProcess();

    useImperativeHandle(ref, () => ({
        switchMapKind: loadMap,
        focusItem({ itemId, zoom, select }) {
            return focusItem({
                itemId,
                zoom,
                select,
            })
        },
        fitAllItemsExtent() {
            fitToDefaultExtent(true);
        },
        switchBackground(value) {
            map?.switchBackground(value);
        },
        async filter(condition) {            
            if (Object.keys(condition).length === 0) {
                // 条件未指定
                setFilteredItem(null);
                return false;
            };
    
            const h = showProcessMessage({
                overlay: true,
                spinner: true,
            });
            const utcOffset = dayjs().utcOffset();
            const paramCondition: Condition = {
                category: condition.category,
                keyword: condition.keyword,
                date: condition.date ? condition.date.map(d => {
                    return {
                        date: d,
                        utcOffset,
                    }
                }): undefined,
            }
            try {
                const result = await gqlClient.query(SearchDocument, {
                    condition: paramCondition,
                    datasourceIds: visibleDataSourceIds,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const hitItems = result.data?.search ?? [];
                if (hitItems.length === 0) {
                    confirm({
                        message: '該当するものが見つかりませんでした',
                        btnPattern: ConfirmBtnPattern.OkOnly,
                    })
                    setFilteredItem(null);
                    return false;
                }
                setFilteredItem(hitItems);
                return true;
    
            } catch(e) {
                throw e;

            } finally {
                hideProcessMessage(h);

            }
        },
        clearFilter() {
            setFilteredItem(null);
        },

        async loadContent(dataId, changeListener): Promise<LoadContentsResult | null> {
            try {
                const result = await gqlClient.query(GetContentDocument, {
                    id: dataId,
                }, {
                    requestPolicy: 'network-only',
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const content = result.data?.getContent ?? null;
                if (!content) return null;
                
                const dsDef = contentDatasources.find(def => def.datasourceId === content.datasourceId);
                if (!dsDef) return null;
                // content.children = content?.children?.sort(contentsComparator);
                const values = Object.entries(content.values).reduce((acc, [key, value]) => {
                    const field = dsDef.config.fields.find(def => def.key === key);
                    if (!field) return acc;
                    switch(field.type) {
                        case 'string':
                        case 'title':
                        case 'text':
                        case 'date':
                        case 'url':
                            if (typeof value === 'string') {
                                acc[key] = {
                                    type: field.type,
                                    value,
                                }
                            }
                            break;
                        case 'number':
                            if (typeof value === 'number') {
                                acc[key] = {
                                    type: field.type,
                                    value,
                                }
                            }
                            break;
                        case 'image':
                            if (Array.isArray(value)) {
                                acc[key] = {
                                    type: field.type,
                                    value : value as number[],
                                }
                            }
                            break;
                        case 'category':
                        case 'single-category':
                            if (Array.isArray(value)) {
                                acc[key] = {
                                    type: field.type,
                                    value : value as string[],
                                }
                            }
                            break;
                        case 'link':
                            if (Array.isArray(value)) {
                                acc[key] = {
                                    type: field.type,
                                    value : value as [],
                                }
                            }
                            break;
                            
                    }
                    return acc;
                }, {} as LoadContentsResult['content']['values']);
        
                const newContent = {
                    backlinks: content.backlinks,
                    datasourceId: content.datasourceId,
                    id: content.id,
                    usingOtherMap: content.usingOtherMap,
                    readonly: content.readonly,
                    values,
                };
            if (!changeListener) {
                    return {
                        content: newContent,
                    }
                }

                const subscription = gqlClient.subscription(DataUpdateDocument, {
                    id: content.id,
                }).subscribe((result) => {
                    if (!result.data?.dataUpdate) return;
                    changeListener(content.id, result.data.dataUpdate === Operation.Update ? 'update' : 'delete');
                });
                const unsubscribe = () => {
                    subscription.unsubscribe();
                }
                return {
                    content: newContent,
                    unsubscribe,
                }

            } catch(err) {
                throw err;
            }
        },

        async registData(param) {
            return await registDataProcess(param);
        },
        
        async updateData(param) {
            const contents = Object.entries(param.contents?.values ?? {}).reduce((acc, [key, value]) => {
                // 現時点ではlink項目は直接登録対象外
                if (value.type === 'link') return acc;
                acc[key] = value.value;
                return acc;
            }, {} as ContentValueMapInput);
            if (param.key.type === 'dataId') {
                const result = await gqlClient.mutation(UpdateDataDocument, {
                    id: param.key.dataId,
                    item: param.item?.geo ?? undefined,
                    deleteItem: param.item?.geo === null,
                    contents,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
    
            } else {
                const result = await gqlClient.mutation(UpdateDataByOriginalIdDocument, {
                    originalId: param.key.originalId,
                    item: param.item?.geo,
                    contents,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
            }
        },
        async linkContent(param: Parameters<TsunaguMapHandler['linkContent']>[0]) {
            if (param.child.type === 'dataId') {
                const result = await gqlClient.mutation(LinkDataDocument, {
                    id: param.child.dataId,
                    parent: param.parent,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                const result = await gqlClient.mutation(LinkDataByOriginalIdDocument, {
                    originalId: param.child.originalId,
                    parent: param.parent,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
            }
        },
        async unlinkContent(param) {
            const result = await gqlClient.mutation(UnlinkDataDocument, {
                id: param.id,
                parent: param.parent,
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        },
        async getUnpointDataAPI({ datasourceId, nextToken, keyword }) {
            const result = await gqlClient.query(GetUnpointContentsDocument, {
                datasourceId,
                nextToken,
                keyword,
            }, {
                requestPolicy: 'network-only',
            });
            if (!result.data) {
                throw new Error('getUnpoinData error', result.error);
            }
            return {
                contents: result.data.getUnpointContents.contents.map(c => {
                    if (c.dataId) {
                        return {
                            id: {
                                type: 'dataId',
                                dataId: c.dataId,
                            },
                            title: c.title,
                            hasImage: c.hasImage ?? undefined,
                            overview: c.overview ?? undefined,

                        }
                    } else {
                        return {
                            id: {
                                type: 'originalId',
                                originalId: c.originalId,
                            },
                            title: c.title,
                            hasImage: c.hasImage ?? undefined,
                            overview: c.overview ?? undefined,        
                        }
    
                    }
                }),
                nextToken: result.data.getUnpointContents.nextToken ?? undefined,
            }
        },
    
        /**
         * 指定のコンテンツの画像（Blob）を取得する
         */
        async loadImage({imageId, size, refresh}) {
            try {
                const result = await gqlClient.query(GetImageDocument, {
                    imageId,
                    size,
                }, {
                    requestPolicy: refresh ? 'network-only' : undefined,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const base64 = result.data?.getImage ?? '';
                return 'data:image/' + base64;
                            
            } catch(err) {
                throw err;
            }
        },
    
        changeVisibleLayer(targets: ChangeVisibleLayerTarget[]) {
            updateDatasourceVisible(targets);
            loadCurrentAreaContents();
        },
        
        selectItem(id) {
            setSelectItemId(id);
        },
    }));

    // categoriesQueryAtomなどは随時ローディングが走るので、Suspenseで囲っている
    return (
        <Suspense>
            <EventListener />
        </Suspense>
    )
}

function EventListener() {
    const { onItemDatasourcesVisibleChanged, onMapDefineChanged, onShowingItemsChanged, onCategoriesLoaded, onEventsLoaded, onModeChanged, onSelectChange }  = useContext(OwnerContext);

    /**
     * 現在の地図定義情報が変化した場合に呼び出し元にイベント発火する
     */
    const [ currentMapDefine ] = useAtom(currentMapDefineAtom);
    useWatch(currentMapDefine,
        useCallback(() => {
            if (onMapDefineChanged) {
                onMapDefineChanged({
                    contentDatasources: currentMapDefine?.contentDataSources,
                    itemDatasources: currentMapDefine?.itemDataSources,
                })
            }
        }, [onMapDefineChanged, currentMapDefine])
    )

    /**
     * アイテムDatasourceの表示状態が変化した場合に呼び出し元にイベント発火する
     */
    const [ visibleList ] = useAtom(itemDatasourcesWithVisibleAtom);
    useWatch(visibleList,
        useCallback(() => {
            if (onItemDatasourcesVisibleChanged) {
                onItemDatasourcesVisibleChanged(visibleList)
            }

        }, [onItemDatasourcesVisibleChanged, visibleList])
    , { immediate: true })

    /**
     * カテゴリロード時に呼び出し元にイベント発火する
     */
    const [ categories ] = useAtom(categoriesAtom);
    useWatch(categories, 
        useCallback(() => {
            if (onCategoriesLoaded) {
                onCategoriesLoaded(categories);
            }
        }, [categories, onCategoriesLoaded])
    , { immediate: true })


    /**
     * イベントロード時に呼び出し元にイベント発火する
     */
    const [ events ] = useAtom(eventsAtom);
    useWatch(events,
        useCallback(() => {
            if (onEventsLoaded) {
                onEventsLoaded(events);
            }
        }, [events, onEventsLoaded])
    , { immediate: true })


    /**
     * 地図モードが変化した場合に呼び出し元にイベント発火する
     */
    const [mapMode] = useAtom(mapModeAtom);
    useWatch(mapMode,
        useCallback(() => {
            if (onModeChanged) {
                onModeChanged(mapMode);
            }
        }, [mapMode, onModeChanged])
    , { immediate: true })

    const [ visibleItems ] = useAtom(showingItemsAtom);
    useWatch(visibleItems,
        useCallback(() => {
            if (onShowingItemsChanged) {
                onShowingItemsChanged(visibleItems);
            }
        }, [onShowingItemsChanged, visibleItems])
    , { immediate: true })

    /**
     * 選択アイテムが変化した場合に呼び出し元にイベント発火する
     */
    const [selectedItemId] = useAtom(selectItemIdAtom);
    useWatch(selectedItemId,
        useCallback(() => {
            if (!onSelectChange) return;
            if (selectedItemId) {
                onSelectChange(selectedItemId);
            } else {
                onSelectChange(null);
            }
        }, [selectedItemId, onSelectChange])
    , { immediate: true })

    return null;
}

export default React.forwardRef(EventConnectorWithOwner);
