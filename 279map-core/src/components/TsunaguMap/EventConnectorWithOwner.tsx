import React, { useContext, useCallback, useImperativeHandle } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { mapModeAtom, selectItemIdAtom } from '../../store/operation';
import { currentMapDefineAtom, currentMapKindAtom, mapDefineAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { itemDatasourcesWithVisibleAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { useAtomCallback } from 'jotai/utils';
import { allItemContentListAtom, loadedItemMapAtom, storedItemsAtom } from '../../store/item';
import { useMapController } from '../../store/useMapController';
import useDataSource from '../../store/datasource/useDataSource';
import { ContentsDefine, GetContentsDocument, GetUnpointContentsDocument, LinkContentDocument, RegistContentDocument, SearchDocument, GetThumbDocument, GetSnsPreviewDocument, ParentOfContent, GetContentsInItemDocument, SortCondition, ContentType, UpdateContentDocument, RemoveContentDocument, UnlinkContentDocument, UpdateItemsDocument } from '../../graphql/generated/graphql';
import { clientAtom } from 'jotai-urql';
import { DataId } from '../../types-common/common-types';
import { useItems } from '../../store/item/useItems';
import useConfirm from '../common/confirm/useConfirm';
import { ConfirmBtnPattern } from '../common/confirm/types';
import dayjs from 'dayjs';
import useItemProcess from '../../store/item/useItemProcess';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadContents' | 'loadContentsInItem' | 'loadContentImage'
    | 'filter' | 'clearFilter'
    | 'updateItem'
    | 'registContent' | 'updateContent' | 'removeContent'
    | 'linkContent' | 'unlinkContent'
    | 'getSnsPreviewAPI' | 'getUnpointDataAPI'
    | 'changeVisibleLayer'
    | 'selectItem'>

function EventConnectorWithOwner(props: {}, ref: React.ForwardedRef<EventControllerHandler>) {
    const { changeMapKind } = useMapController();
    const { focusItem, fitToDefaultExtent } = useMap();
    const { updateDatasourceVisible } = useDataSource();
    const [ gqlClient ] = useAtom(clientAtom);
    const [ , setFilteredItem ] = useAtom(filteredItemsAtom);
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    const { confirm } = useConfirm();
    const [ mapDefine ] = useAtom(mapDefineAtom);
    const [ , setSelectItemId ] = useAtom(selectItemIdAtom);

    /**
     * コンテンツ用comparator
     */
    const contentsComparator = useCallback((a: ContentsDefine, b: ContentsDefine) => {
        const sortCondition = mapDefine?.options.contentsSortCondition ?? SortCondition.CreatedAtAsc;
        // TODO: 現状、コンテンツが作成日時、更新日時を持っていないので、それらのソート処理については未対応。
        //       後日、backend側の対応が完了してから、そちらについては実装する
        switch(sortCondition) {
            case SortCondition.DateAsc:
            case SortCondition.DateDesc:
                {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    const aVal = dayjs(a.date).valueOf();
                    const bVal = dayjs(b.date).valueOf();
                    return (sortCondition === SortCondition.DateAsc ? 1 : -1) * (aVal - bVal)
                }
        }
        return 0;
    }, [mapDefine]);

    const { updateItems } = useItemProcess();

    useImperativeHandle(ref, () => ({
        switchMapKind: changeMapKind,
        focusItem(itemId, opts) {
            return focusItem({
                itemId,
                zoom: opts?.zoom,
                select: opts?.select,
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
        async loadContents(contentIds: DataId[]): Promise<ContentsDefine[]> {
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
                return list.sort(contentsComparator);

            } catch(err) {
                throw err;
            }
        },
        async loadContentsInItem(itemId) {
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
                return list.sort(contentsComparator);
        
            } catch(err) {
                throw err;
            }
        },
        async updateItem(itemId, param, opt) {
            if (opt?.backend) {
                return updateItems([
                    {
                        id: itemId,
                        name: param.name,
                    }
                ])
            } else {
                const result = await gqlClient.mutation(UpdateItemsDocument, {
                    targets: {
                        id: itemId,
                        name: param.name,
                    }
                })
                if (result.error) {
                    throw new Error(result.error.message);
                }
            }
        },
        async registContent(param) {
            try {
                const result = await gqlClient.mutation(RegistContentDocument, {
                    datasourceId: param.datasourceId,
                    parent: {
                        type: param.parent.type === 'item' ? ParentOfContent.Item : ParentOfContent.Content,
                        id: param.parent.id,
                    },
                    values: param.values,
                });
                if (result.error) {
                    throw new Error(result.error.message);
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
    
        async getUnpointDataAPI(datasourceId: string, nextToken?: string) {
            const result = await gqlClient.query(GetUnpointContentsDocument, {
                datasourceId,
                nextToken,
            }, {
                requestPolicy: 'network-only',
            });
            if (!result.data) {
                throw new Error('getUnpoinData error', result.error);
            }
            return result.data.getUnpointContents;
    
        },
    
        /**
         * 指定のコンテンツの画像（Blob）を取得する
         */
        async loadContentImage({contentId, size, refresh}) {
            try {
                const result = await gqlClient.query(GetThumbDocument, {
                    contentId,
                    size,
                }, {
                    requestPolicy: refresh ? 'network-only' : undefined,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const base64 = result.data?.getThumb ?? '';
                return 'data:image/' + base64;
                            
            } catch(err) {
                throw err;
            }
        },
    
        changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean) {
            updateDatasourceVisible({
                target,
                visible,
            });
        },
        
        selectItem(id) {
            setSelectItemId(id);
        },
    }));

    useMapLoadListener();
    useEventListener();

    return null;
}

/**
 * 地図ロード時に呼び出し元にイベント発火する
 */
function useMapLoadListener() {
    const { onMapLoad } = useContext(OwnerContext);
    const [ currentMapKind ] = useAtom(currentMapKindAtom);

    const resetItems = useAtomCallback(
        useCallback(async(get, set) => {
            set(storedItemsAtom, {});
            set(loadedItemMapAtom, {});
        }, [])
    );

    useWatch(currentMapKind,
        useAtomCallback(
            useCallback((get) => {
                const mapDefine = get(currentMapDefineAtom);
                if (onMapLoad && currentMapKind) {
                    onMapLoad({
                        mapKind: currentMapKind,
                        contentDatasources: (mapDefine?.contentDataSources ?? []),
                        itemDatasources: (mapDefine?.itemDataSources ?? []),
                    })
                    resetItems();
                }
            }, [currentMapKind, onMapLoad, resetItems])
        )
    , { immediate: true })

}

function useEventListener() {
    const { onItemDatasourcesVisibleChanged, onLoadedItemsChanged, onCategoriesLoaded, onEventsLoaded, onModeChanged, onSelectChange }  = useContext(OwnerContext);

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

    const [ allItems ] = useAtom(allItemContentListAtom);
    useWatch(allItems,
        useCallback(() => {
            if (onLoadedItemsChanged) {
                onLoadedItemsChanged(allItems);
            }
        }, [onLoadedItemsChanged, allItems])
    , { immediate: true })

    /**
     * 選択アイテムが変化した場合に呼び出し元にイベント発火する
     */
    const [selectedItemId] = useAtom(selectItemIdAtom);
    const { getItem } = useItems();
    useWatch(selectedItemId,
        useCallback(() => {
            if (!onSelectChange) return;
            if (selectedItemId) {
                const item = getItem(selectedItemId);
                onSelectChange(item.id);
            } else {
                onSelectChange(null);
            }
        }, [selectedItemId, onSelectChange, getItem])
    , { immediate: true })

}

export default React.forwardRef(EventConnectorWithOwner);
