import React, { useContext, useCallback, useImperativeHandle, Suspense } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { mapModeAtom, selectItemIdAtom } from '../../store/operation';
import { mapDefineAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler, LoadContentsResult } from '../../types/types';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom, itemDatasourcesWithVisibleAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { overrideItemsAtom, showingItemsAtom, } from '../../store/item';
import { useMapController } from '../../store/map/useMapController';
import useDataSource, { ChangeVisibleLayerTarget } from '../../store/datasource/useDataSource';
import { ContentsDefine, GetContentsDocument, GetUnpointContentsDocument, LinkContentDocument, SearchDocument, GetSnsPreviewDocument, ParentOfContent, GetContentsInItemDocument, SortCondition, ContentType, UpdateContentDocument, RemoveContentDocument, UnlinkContentDocument, GetImageDocument, ContentUpdateDocument, Operation, RegistDataDocument } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import useConfirm from '../common/confirm/useConfirm';
import { ConfirmBtnPattern } from '../common/confirm/types';
import dayjs from 'dayjs';
import useItemProcess from '../../store/item/useItemProcess';
import { useAtomCallback } from 'jotai/utils';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadContents' | 'loadContentsInItem' | 'loadImage'
    | 'filter' | 'clearFilter'
    | 'registContent' | 'updateContent' | 'removeContent'
    | 'linkContent' | 'unlinkContent'
    | 'getSnsPreviewAPI' | 'getUnpointDataAPI'
    | 'changeVisibleLayer'
    | 'selectItem'>

function EventConnectorWithOwner(props: {}, ref: React.ForwardedRef<EventControllerHandler>) {
    const { loadMap } = useMapController();
    const { focusItem, fitToDefaultExtent, loadCurrentAreaContents } = useMap();
    const { updateDatasourceVisible } = useDataSource();
    const [ gqlClient ] = useAtom(clientAtom);
    const [ , setFilteredItem ] = useAtom(filteredItemsAtom);
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
    const contentsComparator = useCallback((a: ContentsDefine, b: ContentsDefine) => {
        const sortCondition = mapDefine?.options.contentsSortCondition ?? SortCondition.CreatedAtAsc;
        switch(sortCondition) {
            case SortCondition.DateAsc:
            case SortCondition.DateDesc:
                {

                    const aDateField = contentDatasources
                                        .find(c => c.datasourceId === a.datasourceId)?.config.fields
                                        .find(f => f.type === 'date');
                    const bDateField = contentDatasources
                        .find(c => c.datasourceId === b.datasourceId)?.config.fields
                        .find(f => f.type === 'date');
                    const aDate = aDateField ? a.values[aDateField.key] : undefined;
                    const bDate = bDateField ? b.values[bDateField.key] : undefined;
                    if (!aDate && !bDate) return 0;
                    if (!aDate) return 1;
                    if (!bDate) return -1;
                    const aVal = dayjs(aDate).valueOf();
                    const bVal = dayjs(bDate).valueOf();
                    return (sortCondition === SortCondition.DateAsc ? 1 : -1) * (aVal - bVal)
                }
        }
        return 0;
    }, [mapDefine, contentDatasources]);

    const { updateItems } = useItemProcess();

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
            try {
                const result = await gqlClient.query(SearchDocument, {
                    condition,
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
        async loadContents(contentIds, changeListener): Promise<LoadContentsResult> {
            try {
                const result = await gqlClient.query(GetContentsDocument, {
                    ids: contentIds,
                }, {
                    requestPolicy: 'network-only'
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const list = result.data?.getContents ?? [];
                const contents = list.sort(contentsComparator);

                if (!changeListener) {
                    return {
                        contents
                    }
                }

                const subscriptionList = contentIds.map(contentId => {
                    return gqlClient.subscription(ContentUpdateDocument, {
                        contentId,
                    }).subscribe((result) => {
                        if (!result.data?.contentUpdate) return;
                        changeListener(contentId, result.data.contentUpdate === Operation.Update ? 'update' : 'delete');
                    });
                })
                const unsubscribe = () => {
                    subscriptionList.forEach(subscription => subscription.unsubscribe())
                }
                return {
                    contents,
                    unsubscribe,
                }

            } catch(err) {
                throw err;
            }
        },
        async loadContentsInItem(itemId, changeListener): Promise<LoadContentsResult> {
            try {
                const result = await gqlClient.query(GetContentsInItemDocument, {
                    itemId: itemId,
                }, {
                    requestPolicy: 'network-only',
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const list = result.data?.getContentsInItem ?? [];
                const contents = list.sort(contentsComparator);
        
                if (!changeListener) {
                    return {
                        contents
                    }
                }

                const subscriptionList = contents.map(content => {
                    return gqlClient.subscription(ContentUpdateDocument, {
                        contentId: content.id,
                    }).subscribe((result) => {
                        if (!result.data?.contentUpdate) return;
                        changeListener(content.id, result.data.contentUpdate === Operation.Update ? 'update' : 'delete');
                    });
                })
                const unsubscribe = () => {
                    subscriptionList.forEach(subscription => subscription.unsubscribe())
                }
                return {
                    contents,
                    unsubscribe,
                }

            } catch(err) {
                throw err;
            }
        },
        async registContent(param) {
            try {
                const result = await gqlClient.mutation(RegistDataDocument, {
                    datasourceId: param.datasourceId,
                    contents: param.values,
                    linkItems: [param.parent.id]
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const contentId = result.data?.registData;
                if (!contentId) {
                    throw new Error('regist content failed');
                }

            } catch(e) {
                throw new Error('registContent failed.' + e);
            }
        },
        async updateContent(param) {
            const result = await gqlClient.mutation(UpdateContentDocument, {
                id: param.id,
                type: ContentType.Normal,
                values: param.values,
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        },
        async removeContent(param) {
            const result = await gqlClient.mutation(RemoveContentDocument, {
                id: param.id,
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        },
        async linkContent(param: Parameters<TsunaguMapHandler['linkContent']>[0]) {
            const result = await gqlClient.mutation(LinkContentDocument, {
                id: param.id,
                parent: {
                    type: param.parent.type === 'item' ? ParentOfContent.Item : ParentOfContent.Content,
                    id: param.parent.id,
                }
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        },
        async unlinkContent(param) {
            const result = await gqlClient.mutation(UnlinkContentDocument, {
                id: param.id,
                parent: {
                    type: param.parent.type === 'content' ? ParentOfContent.Content : ParentOfContent.Item,
                    id: param.parent.id,
                }
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        },
        async getSnsPreviewAPI(url: string) {
            const res = await gqlClient.query(GetSnsPreviewDocument, {
                url,
            });
            if (!res.data) {
                throw new Error('get sns preview error');
            }

            return res.data.getSnsPreview;
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
                contents: result.data.getUnpointContents.contents.map(c => ({
                    id: c.id,
                    title: c.title,
                    thumb: c.thumb ?? undefined,
                    overview: c.overview ?? undefined,
                })),
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
    const { onItemDatasourcesVisibleChanged, onShowingItemsChanged, onCategoriesLoaded, onEventsLoaded, onModeChanged, onSelectChange }  = useContext(OwnerContext);

    /**
     * Datasource定義、表示状態が変化した場合に呼び出し元にイベント発火する
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
