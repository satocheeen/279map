import React, { useImperativeHandle, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { LoadContentsParam, LoadContentsResult, linkContentToItem, loadCategories, loadContents, loadEvents, loadOriginalIconDefine, registContent, updateContent } from '../../store/data/dataThunk';
import { addListener, doCommand, removeListener } from '../../util/Commander';
import MapChart from './MapChart';
import { operationActions } from '../../store/operation/operationSlice';
import { OwnerContext } from './TsunaguMap';
import { sessionActions } from '../../store/session/sessionSlice';
import { connectMap, loadMapDefine } from '../../store/session/sessionThunk';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import styles from './MapWrapper.module.scss';
import { ConnectAPIResult, LoadMapDefineResult, TsunaguMapHandler } from '../../types/types';
import { ErrorType, GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam, UpdateContentParam } from "tsunagumap-api";
import { search } from '../../store/operation/operationThunk';
import Spinner from '../common/spinner/Spinner';
import { useMounted } from '../../util/useMounted';
import { DataId, FeatureType, MapKind, UnpointContent } from '279map-common';
import { useWatch } from '../../util/useWatch';
import { useMap } from '../map/useMap';
import { createAPICallerInstance } from '../../api/ApiCaller';
import { dataActions } from '../../store/data/dataSlice';
import useEvent from '../../store/data/useEvent';
import useCategory from '../../store/data/useCategory';
import useDataSource from '../../store/data/useDataSource';

type Props = {};

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
function MapWrapper(props: Props, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const ownerContext = useContext(OwnerContext);
    const connectStatus = useSelector((state: RootState) => state.session.connectStatus);
    const currentMapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);
    const currentDataSourceGroups = useSelector((state: RootState) => state.data.dataSourceGroups);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onDatasourceChangedRef = useRef<typeof ownerContext.onDatasourceChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const dispatch = useAppDispatch();
    const { getApi, getMap } = useMap();

    useImperativeHandle(ref, () => ({
        switchMapKind(mapKind: MapKind) {
            doCommand({
                command: 'ChangeMapKind',
                param: mapKind,
            });
        },
        focusItem(itemId: DataId, opts?: {zoom?: boolean}) {
            doCommand({
                command: 'FocusItem',
                param: {
                    itemId,
                    zoom: opts?.zoom,
                }
            });
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
        async loadContentsAPI(param: LoadContentsParam): Promise<LoadContentsResult> {
            const res = await dispatch(loadContents(param));
            if ('error' in res) {
                // @ts-ignore
                const errorMessage = res.payload?.message ?? '';
                throw new Error('registContentAPI failed.' + errorMessage);
            }
            return res.payload;
        },

        async showDetailDialog(param: {type: 'item' | 'content'; id: DataId}) {
            if (param.type === 'content') {
                doCommand({
                    command: 'ShowContentInfo',
                    param: param.id,
                });
            } else {
                doCommand({
                    command: 'ShowItemInfo',
                    param: param.id,
                });
            }
        },
        async registContentAPI(param: RegistContentParam) {
            const res = await dispatch(registContent(param));
            if ('error' in res) {
                // @ts-ignore
                const errorMessage = res.payload?.message ?? '';
                throw new Error('registContentAPI failed.' + errorMessage);
            }
        },
        async updateContentAPI(param: UpdateContentParam) {
            await dispatch(updateContent(param));
        },
        async linkContentToItemAPI(param: LinkContentToItemParam) {
            await dispatch(linkContentToItem(param));
        },
    
        async getSnsPreviewAPI(url: string) {
            const res = await getApi().callApi(GetSnsPreviewAPI, {
                url,
            });
            return res;
        },
    
        async getUnpointDataAPI(dataSourceId: string, nextToken?: string) {
            const result = await getApi().callApi(GetUnpointDataAPI, {
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
            const imgData = await getApi().callApi(GetThumbAPI, {
                id: contentId.id,
            });
            return URL.createObjectURL(imgData);
        },
    
        changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean) {
            dispatch(dataActions.updateDatasourceVisible({
                target,
                visible,
            }));
        },
                                                        
    }));

    useWatch(() => {
        dispatch(sessionActions.setMapServer({
            host: ownerContext.mapServer.host,
            ssl: ownerContext.mapServer.ssl,
            token: ownerContext.mapServer.token,
        }));
    }, [ownerContext.mapServer]);

    useWatch(() => {
        onConnectRef.current = ownerContext.onConnect;
        onMapKindChangedRef.current = ownerContext.onMapLoad;
        onDatasourceChangedRef.current = ownerContext.onDatasourceChanged;
        onSelectRef.current = ownerContext.onSelect;
        onModeChangedRef.current = ownerContext.onModeChanged;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    const mapServer = useSelector((state: RootState) => state.session.mapServer);

    /**
     * 初回処理
     */
    useWatch(() => {
        dispatch(sessionActions.setInstanceId(ownerContext.mapInstanceId));

        // API Accessor用意
        createAPICallerInstance(ownerContext.mapInstanceId, mapServer, (error) => {
            // コネクションエラー時
            dispatch(sessionActions.updateConnectStatus({
                status: 'failure',
                error,
            }));
        });

        const h = addListener('LoadLatestData', async() => {
            const pH = showProcessMessage({
                overlay: false,
                spinner: true,
            });
            await dispatch(loadEvents());
            await dispatch(loadCategories());
            hideProcessMessage(pH);
        });
        return () => {
            removeListener(h);
        }

    }, [mapServer, ownerContext.mapInstanceId]);

    /**
     * connect to map
     */
    useWatch(() => {
        if (mapServer.host.length === 0) return;

        // connect
        dispatch(connectMap({
            mapId: ownerContext.mapId,
        }))
        .then((res) => {
            const result = res.payload as ConnectAPIResult;
            if (onConnectRef.current) {
                if (result.result === 'success') {
                    onConnectRef.current({
                        result: 'success',
                        mapDefine: result.connectResult.mapDefine,
                    });
                } else {
                    onConnectRef.current({
                        result: 'failure',
                        error: result.error,
                    });
                }
            }
            return result;
        })
        .then((res) => {
            if (res.result!== 'success') {
                return;
            }
            const mapKind = res.connectResult.mapDefine.defaultMapKind;
            console.log('connect success. load mapdefine');
            return dispatch(loadMapDefine(mapKind));
        })
        .then((res) => {
            const result = res?.payload as LoadMapDefineResult;
            if (result && result.result === 'success') {
                dispatch(loadOriginalIconDefine());
                dispatch(loadEvents());
                dispatch(loadCategories());
            }
        })
        .catch(err => {
            console.warn('connect error', err);
        })
    }, [ownerContext.mapId, mapServer]);

    /**
     * load map define when mapkind has changed.
     */
    useMounted(() => {
        const h = addListener('ChangeMapKind', async(mapKind: MapKind) => {
            if (currentMapKind === mapKind) {
                return;
            }
            await dispatch(loadMapDefine(mapKind));
            dispatch(loadEvents());
            dispatch(loadCategories());
        });

        return () => {
            removeListener(h);
        }
    })

    useEffect(() => {
        if (!currentMapKind) return;

        if (onMapKindChangedRef.current) {
            onMapKindChangedRef.current({
                mapKind: currentMapKind,
            });
        }
    }, [currentMapKind]);

    /**
     * レイヤの表示・非表示切り替え
     */
    useWatch(() => {
        getMap()?.updateLayerVisible(currentDataSourceGroups);

        if (onDatasourceChangedRef.current) {
            onDatasourceChangedRef.current({
                dataSourceGroups: currentDataSourceGroups,
            })
        }
    }, [currentDataSourceGroups]);

    /**
     * 選択アイテムが変更されたらコールバック
     */
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    useEffect(() => {
        if (onSelectRef.current) {
            onSelectRef.current(selectedItemIds);
        }
    }, [selectedItemIds]);

    /**
     * callback when map mode has changed.
     */
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);
    useEffect(() => {
        if (onModeChangedRef.current) {
            onModeChangedRef.current(mapMode);
        }
    }, [mapMode]);

    /**
     * callback when categories has loaded or changed.
     */
    const { categories } = useCategory();;
    useEffect(() => {
        if (onCategoriesLoadedRef.current) {
            onCategoriesLoadedRef.current(categories);
        }
    }, [categories]);

    /**
     * callback when events has loaded or changed.
     */
    const { events } = useEvent();
    useEffect(() => {
        if(onEventsLoadedRef.current) {
            onEventsLoadedRef.current(events);
        }
    }, [events]);

    const { visibleDataSourceIds } = useDataSource();
    /**
     * set filter
     */
    useWatch(() => {
        if (ownerContext.filter && ownerContext.filter.conditions.length > 0) {
            dispatch(search(ownerContext.filter.conditions));
        } else {
            dispatch(operationActions.clearFilter());
        }
    }, [ownerContext.filter, visibleDataSourceIds]);

    const messageIdRef = useRef<number>();
    useWatch(() => {
        if (connectStatus.status === 'connecting-map') {
            messageIdRef.current = showProcessMessage({
                overlay: true,
                spinner: true,
                message: 'ロード中...'
            });
        } else if (connectStatus.status === 'failure') {
            if (messageIdRef.current) {
                hideProcessMessage(messageIdRef.current);
            }
            const errorMessage = function(){
                switch(connectStatus.error.type) {
                    case 'UndefinedMapServer':
                        return '地図サーバーに接続できません';
                    case ErrorType.UndefinedMap:
                        return '指定の地図は存在しません';
                    case ErrorType.Unauthorized:
                        return 'この地図を表示するには、ログインが必要です';
                    case ErrorType.Forbidden:
                        return 'この地図へのアクセス権限がありません。再ログインして問題が解決しない場合は、管理者へ問い合わせてください。';
                    case ErrorType.SessionTimeout:
                        return 'しばらく操作されなかったため、セッション接続が切れました。再ロードしてください。';
                    case ErrorType.IllegalError:
                        return '想定外の問題が発生しました。再ロードしても問題が解決しない場合は、管理者へ問い合わせてください。';
                }
            }();
            const detail = connectStatus.error.detail ? `\n${connectStatus.error.detail}` : '';
            messageIdRef.current = showProcessMessage({
                overlay: true,
                spinner: false,
                message: errorMessage + detail
            });
        } else if (connectStatus.status === 'connected') {
            if (messageIdRef.current) {
                hideProcessMessage(messageIdRef.current);
            }
        }
    }, [connectStatus, currentMapKind]);

    return (
        <>
            {currentMapKind &&
                <MapChart />
            }
            <Overlay />
        </>
    );
}

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
function Overlay() {
    const { isShowOverlay, isShowSpinner, processMessage } = useProcessMessage();

    return (
        <div className={`${isShowOverlay ? styles.Overlay : styles.MinOverlay}`}>
            {isShowSpinner &&
                <div className={styles.GraphSpinner}>
                    <Spinner size={isShowOverlay ? 'normal' : 'small'} />
                </div>
            }
            {processMessage &&
                <p className={styles.Message}>{processMessage}</p>
            }
        </div>
    )
}

export default React.forwardRef(MapWrapper);
