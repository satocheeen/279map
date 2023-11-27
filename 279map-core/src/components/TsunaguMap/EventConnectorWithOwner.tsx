import React, { useRef, useContext, useEffect, useCallback, useImperativeHandle } from 'react';
import { useWatch } from '../../util/useWatch2';
import { OwnerContext } from './TsunaguMap';
import { categoriesAtom, categoriesLoadableAtom } from '../../store/category';
import { eventsLoadableAtom } from '../../store/event';
import { dialogTargetAtom, mapModeAtom, showingDetailItemIdAtom } from '../../store/operation';
import { connectStatusLoadableAtom, mapDefineLoadableAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { GetSnsPreviewAPI, GetThumbAPI, SearchAPI } from 'tsunagumap-api';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { DataId, DataSourceGroup, MapKind } from '279map-common';
import { MapMode, TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { itemDataSourceGroupsAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { useAtomCallback } from 'jotai/utils';
import { allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { useMapController } from '../../store/useMapController';
import useDataSource from '../../store/datasource/useDataSource';
import { useApi } from '../../api/useApi';
import { CategoryDefine, EventDefine, ContentsDefine, GetContentsDocument, MutationUpdateContentArgs, GetUnpointContentsDocument, MutationLinkContentArgs, LinkContentDocument, MutationRegistContentArgs, RegistContentDocument } from '../../graphql/generated/graphql';
import { updateContentAtom } from '../../store/content';
import { clientAtom } from 'jotai-urql';

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
    const { callApi } = useApi();
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
            const res = await callApi(GetSnsPreviewAPI, {
                url,
            });
            return res;
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
            const imgData = await callApi(GetThumbAPI, {
                id: contentId.id,
            });
            return URL.createObjectURL(imgData);
        },
    
        changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean) {
            updateDatasourceVisible({
                target,
                visible,
            });
        },
                                                        
    }));

    useFilterListner();
    useConnectListener();
    useMapLoadListener();
    useDataSourceChangeListener();
    useCategoryLoadListener();
    useEventLoadListener();
    useMapModeChangeListener();
    useSelectChangeLister();

    return null;
}

function useFilterListner() {
    const { filter } = useContext(OwnerContext);

    // 検索
    const [filteredItem, setFilteredItem] = useAtom(filteredItemsAtom);
    const { callApi } = useApi();
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    useWatch(filter, () => {
        const conditions = filter?.conditions;
        if (!conditions) {
            setFilteredItem(null);
            return;
        };

        const h = showProcessMessage({
            overlay: true,
            spinner: true,
        });
        callApi(SearchAPI, {
            conditions,
            dataSourceIds: visibleDataSourceIds,
        }).then(res => {
            setFilteredItem(res.items);
        }).finally(() => {
            hideProcessMessage(h);
        });

    })
}

/**
 * connect時に呼び出し元にイベント発火する
 */
function useConnectListener() {
    const { onConnect } = useContext(OwnerContext);
    const [ connectLoadable ] = useAtom(connectStatusLoadableAtom);
    const connectedRef = useRef(false);

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (!connectedRef.current && connectLoadable.state === 'hasData') {
            connectedRef.current = true;
            if (onConnect) {
                onConnect({
                    mapDefine: connectLoadable.data.mapDefine,
                })
            }
        }
    });

}

/**
 * 地図ロード時に呼び出し元にイベント発火する
 */
function useMapLoadListener() {
    const { onMapLoad } = useContext(OwnerContext);
    const [ mapDefineLoadable ] = useAtom(mapDefineLoadableAtom);
    const latestMapKindRef = useRef<MapKind>();

    const resetItems = useAtomCallback(
        useCallback(async(get, set) => {
            set(allItemsAtom, {});
            set(loadedItemMapAtom, {});
        }, [])
    );

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (mapDefineLoadable.state === 'hasData' && latestMapKindRef.current !== mapDefineLoadable.data.mapKind) {
            latestMapKindRef.current = mapDefineLoadable.data.mapKind;
            if (onMapLoad) {
                onMapLoad({
                    mapKind: mapDefineLoadable.data.mapKind,
                })
            }
            resetItems();
        }
    });
}

/**
 * Datasource定義、表示状態が変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function useDataSourceChangeListener() {
    const ownerContext = useContext(OwnerContext);
    const [ itemDataSources ] = useAtom(itemDataSourceGroupsAtom);
    const latestDataSourceGroupsRef = useRef<DataSourceGroup[]>();

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (JSON.stringify(latestDataSourceGroupsRef.current) !== JSON.stringify(itemDataSources)) {
            console.log('DataSourceChange');
            if (ownerContext.onDatasourceChanged) {
                ownerContext.onDatasourceChanged({
                    dataSourceGroups: itemDataSources,
                })
                latestDataSourceGroupsRef.current = itemDataSources;
            }
        }
     })
}

/**
 * カテゴリロード時に呼び出し元にイベント発火する
 */
function useCategoryLoadListener() {
    const { onCategoriesLoaded}  = useContext(OwnerContext);
    const [ categoriesLoadable ] = useAtom(categoriesLoadableAtom);
    const [ categories ] = useAtom(categoriesAtom);
    const latestCategories = useRef<CategoryDefine[]>();

    useWatch(categories, () => {
        if (onCategoriesLoaded) {
            onCategoriesLoaded(categories);
        }
        latestCategories.current = categories;
    })
     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (categoriesLoadable.state !== 'hasData') return;

        if (JSON.stringify(categoriesLoadable.data) !== JSON.stringify(latestCategories.current)) {
            if (onCategoriesLoaded) {
                onCategoriesLoaded(categoriesLoadable.data);
            }
            latestCategories.current = categoriesLoadable.data;
        }
    });
}

/**
 * イベントロード時に呼び出し元にイベント発火する
 */
function useEventLoadListener() {
    const { onEventsLoaded }  = useContext(OwnerContext);
    const latestEvents = useRef<EventDefine[]>();
    const [ eventLoadable ] = useAtom(eventsLoadableAtom);

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (eventLoadable.state !== 'hasData') return;
        const events = eventLoadable.data;

        if (JSON.stringify(events) !== JSON.stringify(latestEvents.current)) {
            if (onEventsLoaded) {
                onEventsLoaded(events);
            }
            latestEvents.current = events;
        }
    });

}

/**
 * 地図モードが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function useMapModeChangeListener() {
    const { onModeChanged}  = useContext(OwnerContext);
    const [mapMode] = useAtom(mapModeAtom);
    const latestMapModeRef = useRef<MapMode>();

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if(mapMode !== latestMapModeRef.current) {
            if (onModeChanged) {
                onModeChanged(mapMode);
            }
            latestMapModeRef.current = mapMode;
        }
    })

}

/**
 * 選択アイテムが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function useSelectChangeLister() {
    const { onSelect}  = useContext(OwnerContext);
    const [selectedItemId] = useAtom(showingDetailItemIdAtom);
    const latestItemIdsRef = useRef<DataId|null>(null);

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (!selectedItemId) return;
        if (JSON.stringify(selectedItemId) !== JSON.stringify(latestItemIdsRef.current)) {
            if (onSelect) {
                onSelect(selectedItemId);
            }
            latestItemIdsRef.current = selectedItemId;
        }
    });

}
export default React.forwardRef(EventConnectorWithOwner);
