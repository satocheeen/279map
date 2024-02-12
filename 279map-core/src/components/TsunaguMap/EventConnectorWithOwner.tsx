import React, { useContext, useCallback, useImperativeHandle } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { dialogTargetAtom, mapModeAtom, showingDetailItemIdAtom } from '../../store/operation';
import { currentMapDefineAtom, currentMapKindAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { itemDataSourceGroupsAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { useAtomCallback } from 'jotai/utils';
import { loadedItemMapAtom, storedItemsAtom, visibleItemsAtom } from '../../store/item';
import { useMapController } from '../../store/useMapController';
import useDataSource from '../../store/datasource/useDataSource';
import { ContentsDefine, GetContentsDocument, MutationUpdateContentArgs, GetUnpointContentsDocument, MutationLinkContentArgs, LinkContentDocument, MutationRegistContentArgs, RegistContentDocument, SearchDocument, DatasourceGroup, GetThumbDocument, GetSnsPreviewDocument, DatasourceInfo, ParentOfContent, GetContentsInItemDocument } from '../../graphql/generated/graphql';
import { updateContentAtom } from '../../store/content';
import { clientAtom } from 'jotai-urql';
import { MapKind } from '../../graphql/generated/graphql';
import { DataId } from '../../types-common/common-types';
import { useItems } from '../../store/item/useItems';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadContents' | 'loadContentsInItem' | 'loadContentImage'
    | 'showDetailDialog' | 'registContent'
    | 'updateContent' | 'linkContentToItemAPI'
    | 'getSnsPreviewAPI' | 'getUnpointDataAPI'
    | 'getThumbnail' | 'changeVisibleLayer'>

function EventConnectorWithOwner(props: {}, ref: React.ForwardedRef<EventControllerHandler>) {
    const { changeMapKind } = useMapController();
    const { focusItem, fitToDefaultExtent } = useMap();
    const { updateDatasourceVisible } = useDataSource();
    const [, updateContent] = useAtom(updateContentAtom);
    const [ gqlClient ] = useAtom(clientAtom);

    const showDetailDialog = useAtomCallback(
        useCallback((get, set, param: {type: 'item' | 'content'; id: DataId}) => {
            set(dialogTargetAtom, param);
        }, [])
    );

    useImperativeHandle(ref, () => ({
        switchMapKind(mapKind: MapKind) {
            changeMapKind(mapKind);
        },
        focusItem(itemId: DataId, opts?: {zoom?: boolean}) {
            focusItem({
                itemId,
                zoom: opts?.zoom,
            })
        },
        fitAllItemsExtent() {
            fitToDefaultExtent(true);
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
                return result.data?.getContents ?? [];

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
                return result.data?.getContentsInItem ?? [];
        
            } catch(err) {
                throw err;
            }
        },
        async loadContentImage({contentId, size}) {
            try {
                const result = await gqlClient.query(GetThumbDocument, {
                    contentId,
                    size,
                });
                const base64 = result.data?.getThumb;
                if (!base64) return '';
                return 'data:image/' + base64;
                            
            } catch(err) {
                throw err;
            }
        },
        showDetailDialog(param: {type: 'item' | 'content'; id: DataId}) {
            showDetailDialog(param);
        },
        
        async registContent(param: MutationRegistContentArgs) {
            try {
                await gqlClient.mutation(RegistContentDocument, param);

            } catch(e) {
                throw new Error('registContent failed.' + e);
            }
        },
        async updateContent(param: MutationUpdateContentArgs) {
            await updateContent(param);
        },
        async linkContentToItemAPI(param: Parameters<TsunaguMapHandler['linkContentToItemAPI']>[0]) {
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
         * 指定のコンテンツのサムネイル画像（Blob）を取得する
         */
        async getThumbnail(contentId: DataId) {
            const imgData = await gqlClient.query(GetThumbDocument, {
                contentId: contentId,
            });
            return 'data:image/' +  imgData.data?.getThumb;
        },
    
        changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean) {
            updateDatasourceVisible({
                target,
                visible,
            });
        },
                                                        
    }));

    useFilterListner();
    useMapLoadListener();
    useEventListener();

    return null;
}

function useFilterListner() {
    const { filter } = useContext(OwnerContext);

    // 検索
    const [ , setFilteredItem ] = useAtom(filteredItemsAtom);
    const [ gqlClient ] = useAtom(clientAtom);
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    useWatch(filter, async () => {
        const condition = filter?.condition;
        if (!condition || Object.keys(condition).length === 0) {
            setFilteredItem(null);
            return;
        };

        const h = showProcessMessage({
            overlay: true,
            spinner: true,
        });
        const result = await gqlClient.query(SearchDocument, {
            condition,
            datasourceIds: visibleDataSourceIds,
        });
        setFilteredItem(result.data?.search ?? null);
        hideProcessMessage(h);
    })
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
                        contentDataSources: (mapDefine?.contentDataSources ?? []) as DatasourceInfo[],
                        itemDatasourceGroups: (mapDefine?.itemDataSourceGroups ?? []) as DatasourceGroup[],
                    })
                    resetItems();
                }
            }, [currentMapKind, onMapLoad, resetItems])
        )
    , { immediate: true })

}

function useEventListener() {
    const { onDatasourceChanged, onCategoriesLoaded, onEventsLoaded, onModeChanged, onSelect, onVisibleItemsChanged }  = useContext(OwnerContext);

    /**
     * Datasource定義、表示状態が変化した場合に呼び出し元にイベント発火する
     */
    const [ itemDataSources ] = useAtom(itemDataSourceGroupsAtom);
    useWatch(itemDataSources,
        useCallback(() => {
            if (onDatasourceChanged) {
                onDatasourceChanged({
                    datasourceGroups: itemDataSources,
                })
            }

        }, [itemDataSources, onDatasourceChanged])
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

    /**
     * 選択アイテムが変化した場合に呼び出し元にイベント発火する
     */
    const [selectedItemId] = useAtom(showingDetailItemIdAtom);
    const { getItem } = useItems();
    useWatch(selectedItemId,
        useCallback(() => {
            if (onSelect && selectedItemId) {
                const item = getItem(selectedItemId);
                onSelect({
                    id: item.id,
                    name: item.name,
                    lastEditedTime: item.lastEditedTime,
                });
            }
        }, [selectedItemId, onSelect, getItem])
    , { immediate: true })

    /**
     * 表示アイテムが変化した場合に呼び出し元にイベント発火する
     */
    const [ visibleItems ] = useAtom(visibleItemsAtom);
    useWatch(visibleItems,
        useCallback(() => {
            if (onVisibleItemsChanged) {
                onVisibleItemsChanged(visibleItems)
            }
        }, [onVisibleItemsChanged, visibleItems])
    , { immediate: true })
    
}

export default React.forwardRef(EventConnectorWithOwner);
