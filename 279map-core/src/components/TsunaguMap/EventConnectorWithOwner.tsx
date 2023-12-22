import React, { useContext, useCallback, useImperativeHandle } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom } from '../../store/category';
import { eventsAtom } from '../../store/event';
import { dialogTargetAtom, mapModeAtom, showingDetailItemIdAtom } from '../../store/operation';
import { currentMapKindAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { itemDataSourceGroupsAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { useAtomCallback } from 'jotai/utils';
import { allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { useMapController } from '../../store/useMapController';
import useDataSource from '../../store/datasource/useDataSource';
import { ContentsDefine, GetContentsDocument, MutationUpdateContentArgs, GetUnpointContentsDocument, MutationLinkContentArgs, LinkContentDocument, MutationRegistContentArgs, RegistContentDocument, SearchDocument, DatasourceGroup, GetThumbDocument, GetSnsPreviewDocument } from '../../graphql/generated/graphql';
import { updateContentAtom } from '../../store/content';
import { clientAtom } from 'jotai-urql';
import { DataId, MapKind } from '../../graphql/generated/graphql';

/**
 * 呼び出し元とイベント連携するためのコンポーネントもどき。
 * 地図コンポーネントの再レンダリングを最小に抑えるため、地図コンポーネントとは兄弟関係に配置している。
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
export type EventControllerHandler = Pick<TsunaguMapHandler, 
    'switchMapKind' | 'focusItem' | 'loadContentsAPI'
    | 'showDetailDialog' | 'registContentAPI'
    | 'updateContentAPI' | 'linkContentToItemAPI'
    | 'getSnsPreviewAPI' | 'getUnpointDataAPI'
    | 'getThumbnail' | 'changeVisibleLayer'>

function EventConnectorWithOwner(props: {}, ref: React.ForwardedRef<EventControllerHandler>) {
    const { changeMapKind } = useMapController();
    const { focusItem } = useMap();
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
        async loadContentsAPI(contentIds: DataId[]): Promise<ContentsDefine[]> {
            try {
                const getContents = await gqlClient.query(GetContentsDocument, {
                    ids: contentIds,
                }, {
                    requestPolicy: 'network-only'
                });
                return getContents.data?.getContents ?? [];

            } catch(err) {
                throw new Error('registContentAPI failed.' + err);
            }
        },

        showDetailDialog(param: {type: 'item' | 'content'; id: DataId}) {
            showDetailDialog(param);
        },
        
        async registContentAPI(param: MutationRegistContentArgs) {
            try {
                await gqlClient.mutation(RegistContentDocument, param);

            } catch(e) {
                throw new Error('registContentAPI failed.' + e);
            }
        },
        async updateContentAPI(param: MutationUpdateContentArgs) {
            await updateContent(param);
        },
        async linkContentToItemAPI(param: MutationLinkContentArgs) {
            await gqlClient.mutation(LinkContentDocument, param);
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
            return 'data:image/' +  imgData;
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
        if (!condition) {
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
            set(allItemsAtom, {});
            set(loadedItemMapAtom, {});
        }, [])
    );

    useWatch(currentMapKind,
        useCallback(() => {
            if (onMapLoad && currentMapKind) {
                onMapLoad({
                    mapKind: currentMapKind,
                })
                resetItems();
            }
        }, [currentMapKind, onMapLoad, resetItems])
    , { immediate: true })

}

function useEventListener() {
    const { onDatasourceChanged, onCategoriesLoaded, onEventsLoaded, onModeChanged, onSelect }  = useContext(OwnerContext);

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
    useWatch(selectedItemId,
        useCallback(() => {
            if (onSelect && selectedItemId) {
                onSelect(selectedItemId);
            }
        }, [selectedItemId, onSelect])
    , { immediate: true })
}

export default React.forwardRef(EventConnectorWithOwner);
