import React, { useContext, useCallback, useImperativeHandle, Suspense } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { mapModeAtom, selectItemIdAtom } from '../../store/operation';
import { currentMapDefineAtom } from '../../store/session';
import { filteredDatasAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom, itemDatasourceVisibleListAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { overrideItemsAtom, showingItemsAtom, } from '../../store/item';
import { useMapController } from '../../store/map/useMapController';
import useDataSource, { ChangeVisibleLayerTarget } from '../../store/datasource/useDataSource';
import { SearchDocument, GetImageDocument, UpdateDataDocument, UpdateDataByOriginalIdDocument, Condition } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import dayjs from 'dayjs';
import useItemProcess from '../../store/item/useItemProcess';
import { useAtomCallback } from 'jotai/utils';
import { ContentValueMapInput } from '../../types-common/common-types';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadImage'
    | 'filter' | 'clearFilter'
    | 'registData' | 'updateData'
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
    const [ visibleList ] = useAtom(itemDatasourceVisibleListAtom);
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
