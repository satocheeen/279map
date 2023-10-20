import React, { Suspense, useRef, useContext, useEffect, useCallback, useImperativeHandle } from 'react';
import { useWatch } from '../../util/useWatch';
import { OwnerContext } from './TsunaguMap';
import { categoriesLoadableAtom } from '../../store/category';
import { eventsLoadableAtom } from '../../store/event';
import { defaultIconDefineAtom } from '../../store/icon';
import { dialogTargetAtom, mapModeAtom, showingDetailItemIdAtom } from '../../store/operation';
import { authLvAtom, connectStatusLoadableAtom, mapDefineLoadableAtom } from '../../store/session';
import { filteredItemsAtom } from '../../store/filter';
import { useMap } from '../map/useMap';
import { GetContentsAPI, GetContentsParam, GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, SearchAPI, UpdateContentAPI, UpdateContentParam } from 'tsunagumap-api';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { Auth, CategoryDefine, ContentsDefine, DataId, DataSourceGroup, EventDefine, FeatureType, MapKind, UnpointContent } from '279map-common';
import { MapMode, TsunaguMapHandler } from '../../types/types';
import { useAtom } from 'jotai';
import { itemDataSourcesAtom, visibleDataSourceIdsAtom } from '../../store/datasource';
import { useAtomCallback } from 'jotai/utils';
import { allItemsAtom, loadedItemMapAtom } from '../../store/item';
import { useMapController } from '../../store/useMapController';
import { doCommand } from '../../util/Commander';
import useDataSource from '../../store/datasource/useDataSource';
import { useApi } from '../../api/useApi';

/**
 * OwnerContextとJotaiを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをJotaiに設定する
 * - Jotaiの各値の変更検知して呼び出し元に返す
 * - ref経由での操作を実行
 */
function ValueConnectorWithOwner(props: {}, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const { changeMapKind } = useMapController();
    const { focusItem } = useMap();
    const { callApi } = useApi();
    const { updateDatasourceVisible } = useDataSource();

    const showUserList = useAtomCallback(
        useCallback((get) => {
            const authLv = get(authLvAtom);
            if (authLv !== Auth.Admin) {
                console.warn('no authorization', authLv);
                return;
            }
            doCommand({
                command: 'ShowUserList',
                param: undefined,
            });
        }, [])
    );

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
        drawStructure(dataSourceId: string) {
            doCommand({
                command: 'DrawStructure',
                param: dataSourceId,
            });
        },
        moveStructure() {
            doCommand({
                command: 'MoveStructure',
                param: undefined,
            });
        },
        changeStructure() {
            doCommand({
                command: 'ChangeStructure',
                param: undefined,
            });
        },
        removeStructure() {
            doCommand({
                command: 'RemoveStructure',
                param: undefined,
            });
        },
        drawTopography(dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA) {
            doCommand({
                command: 'DrawTopography',
                param: {
                    dataSourceId, 
                    featureType,
                }
            });
        },
        drawRoad(dataSourceId: string) {
            doCommand({
                command: 'DrawRoad',
                param: dataSourceId,
            });
        },
        editTopography() {
            doCommand({
                command:'EditTopography',
                param: undefined,
            });
        },
        removeTopography() {
            doCommand({
                command:'RemoveTopography',
                param: undefined,
            });
        },
        editTopographyInfo() {
            doCommand({
                command:'EditTopographyInfo',
                param: undefined,
            });
        },
        showUserList() {
            showUserList();
        },
        async loadContentsAPI(param: GetContentsParam): Promise<ContentsDefine[]> {
            try {
                const res = await callApi(GetContentsAPI, param);
                return res.contents;

            } catch(err) {
                throw new Error('registContentAPI failed.' + err);
            }
        },

        showDetailDialog(param: {type: 'item' | 'content'; id: DataId}) {
            showDetailDialog(param);
        },
        
        async registContentAPI(param: RegistContentParam) {
            try {
                await callApi(RegistContentAPI, param);

            } catch(e) {
                throw new Error('registContentAPI failed.' + e);
            }
        },
        async updateContentAPI(param: UpdateContentParam) {
            await callApi(UpdateContentAPI, param);
        },
        async linkContentToItemAPI(param: LinkContentToItemParam) {
            await callApi(LinkContentToItemAPI, param);
        },
    
        async getSnsPreviewAPI(url: string) {
            const res = await callApi(GetSnsPreviewAPI, {
                url,
            });
            return res;
        },
    
        async getUnpointDataAPI(dataSourceId: string, nextToken?: string) {
            const result = await callApi(GetUnpointDataAPI, {
                dataSourceId,
                nextToken,
            });
            return {
                contents: result.contents as UnpointContent[],
                nextToken: result.nextToken,
            };
    
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

    return (
        <>
            <Suspense>
                <FilterListner />
            </Suspense>
            <ConnectListener />
            <MapLoadListener />
            <DataSourceChangeListener />
            <CategoryLoadListener />
            <EventLoadListener />
            <MapModeChangeListener />
            <SelectChangeLister />
            <JotaiSetter/>
        </>
    )
}

/**
 * OwnerContextで設定された値のうち、必要なものをJotaiに設定する
 */
function JotaiSetter() {
    const { iconDefine } = useContext(OwnerContext);
    const [ _, setDefaultIconDefine ] = useAtom(defaultIconDefineAtom);

    useEffect(() => {
        if (iconDefine)
            setDefaultIconDefine(iconDefine);

    }, [iconDefine, setDefaultIconDefine]);

    return null;
}

function FilterListner() {
    const { filter } = useContext(OwnerContext);

    // 検索
    const [filteredItem, setFilteredItem] = useAtom(filteredItemsAtom);
    const { callApi } = useApi();
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    useWatch(() => {
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

    }, [filter])

    
    return null;
}

/**
 * connect時に呼び出し元にイベント発火する
 */
function ConnectListener() {
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

    return null;
}

/**
 * 地図ロード時に呼び出し元にイベント発火する
 */
function MapLoadListener() {
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

    return null;    
}

/**
 * Datasource定義、表示状態が変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function DataSourceChangeListener() {
    const ownerContext = useContext(OwnerContext);
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
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

    return null;
}

/**
 * カテゴリロード時に呼び出し元にイベント発火する
 */
function CategoryLoadListener() {
    const { onCategoriesLoaded}  = useContext(OwnerContext);
    const [ categoriesLoadable ] = useAtom(categoriesLoadableAtom);
    const latestCategories = useRef<CategoryDefine[]>();

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

    return null;
}

/**
 * イベントロード時に呼び出し元にイベント発火する
 */
function EventLoadListener() {
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

    return null;
}

/**
 * 地図モードが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function MapModeChangeListener() {
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

    return null;
}

/**
 * 選択アイテムが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function SelectChangeLister() {
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

    return null;
}
export default React.forwardRef(ValueConnectorWithOwner);
