import React, { useImperativeHandle, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { addListener, doCommand, removeListener } from '../../util/Commander';
import MapChart from './MapChart';
import { OwnerContext } from './TsunaguMap';
import { ButtonInProcess, isShowOverlayState, isShowSpinnerState, processMessageState, useProcessMessage } from '../common/spinner/useProcessMessage';
import styles from './MapWrapper.module.scss';
import { TsunaguMapHandler } from '../../types/types';
import { RequestAPI, ErrorType, GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam, UpdateContentParam, WebSocketMessage, GetContentsParam } from "tsunagumap-api";
import Spinner from '../common/spinner/Spinner';
import { useMounted } from '../../util/useMounted';
import { Auth, ContentsDefine, DataId, FeatureType, MapKind, UnpointContent } from '279map-common';
import { useWatch } from '../../util/useWatch';
import { useMap } from '../map/useMap';
import { createAPICallerInstance } from '../../api/ApiCaller';
import useEvent from '../../store/data/useEvent';
import useDataSource from '../../store/data/useDataSource';
import { Button } from '../common';
import Input from '../common/form/Input';
import { useSubscribe } from '../../util/useSubscribe';
import { useItem } from '../../store/data/useItem';
import { useContents } from '../../store/data/useContents';
import useIcon from '../../store/data/useIcon';
import { useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import { connectStatusState, currentMapKindInfoState, currentMapKindState, mapServerState } from '../../store/session/sessionAtom';
import { useMapDefine } from '../../store/data/useMapDefine';
import { filteredItemsState, mapModeState, selectedItemIdsState } from '../../store/operation/operationAtom';
import { useSearch } from '../../store/operation/useSearch';
import { dataSourceGroupsState, visibleDataSourceIdsState } from '../../store/datasource';
import { instanceIdState } from '../../store/data/dataAtom';
import { categoryState } from '../../store/category';

type Props = {};

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
function MapWrapper(props: Props, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const ownerContext = useContext(OwnerContext);
    const [connectStatus, setConnectStatus] = useRecoilState(connectStatusState);
    const currentMapKind = useRecoilValue(currentMapKindState);
    const currentDataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onDatasourceChangedRef = useRef<typeof ownerContext.onDatasourceChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const { getApi, getMap } = useMap();
    const { loadContents, registContent, linkContentToItem, updateContent, removeContent } = useContents();
    const { updateDatasourceVisible } = useDataSource();

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
        showUserList() {
            if (connectStatus.status !== 'connected') return;
            if (connectStatus.connectedMap.authLv !== Auth.Admin) {
                console.warn('no authorization');
                return;
            }
            doCommand({
                command: 'ShowUserList',
                param: undefined,
            });
        },
        async loadContentsAPI(param: GetContentsParam): Promise<ContentsDefine[]> {
            try {
                const res = await loadContents(param);
                return res;

            } catch(err) {
                throw new Error('registContentAPI failed.' + err);
            }
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
            try {
                await registContent(param);

            } catch(e) {
                throw new Error('registContentAPI failed.' + e);
            }
        },
        async updateContentAPI(param: UpdateContentParam) {
            await updateContent(param);
        },
        async linkContentToItemAPI(param: LinkContentToItemParam) {
            await linkContentToItem(param);
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
            updateDatasourceVisible({
                target,
                visible,
            });
        },
                                                        
    }));

    const setMapServer = useSetRecoilState(mapServerState);
    const setCurrentMapKindInfo = useSetRecoilState(currentMapKindInfoState);
    useWatch(() => {
        setMapServer(ownerContext.mapServer);
        setCurrentMapKindInfo(undefined);
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

    const { mapServer } = useContext(OwnerContext);

    const { loadEvents } = useEvent();
    const setInstanceId = useSetRecoilState(instanceIdState);
    /**
     * 初回処理
     */
    useWatch(() => {
        // API Accessor用意
        createAPICallerInstance(ownerContext.mapInstanceId, mapServer, (error) => {
            // コネクションエラー時
            setConnectStatus({
                status: 'failure',
                error,
            });
        });
        setInstanceId(ownerContext.mapInstanceId);

        const h = addListener('LoadLatestData', async() => {
            const pH = showProcessMessage({
                overlay: false,
                spinner: true,
            });
            await loadEvents();
            hideProcessMessage(pH);
        });
        return () => {
            removeListener(h);
        }

    }, [mapServer, ownerContext.mapInstanceId]);

    const { loadOriginalIconDefine } = useIcon();
    const { connectMap, loadMapDefine } = useMapDefine();
    /**
     * connect to map
     */
    const connectToMap = useCallback(() => {
        if (mapServer.host.length === 0) return;

        console.log('connetToMap')
        // connect
        connectMap({
            mapId: ownerContext.mapId,
            instanceId: ownerContext.mapInstanceId,
        })
        .then((res) => {
            if (onConnectRef.current) {
                onConnectRef.current({
                    result: 'success',
                    mapDefine: res.mapDefine,
                });
            }
            const mapKind = res.mapDefine.defaultMapKind;
            console.log('connect success. load mapdefine');
            return loadMapDefine(mapKind);
        })
        .then((res) => {
            loadOriginalIconDefine();
            loadEvents();
        })
        .catch(err => {
            console.warn('connect error', err);
            if (onConnectRef.current) {
                onConnectRef.current({
                    result: 'failure',
                    error: err,
                });
            }
        })
    }, [connectMap, loadMapDefine, loadEvents, ownerContext.mapId, mapServer, loadOriginalIconDefine, ownerContext.mapInstanceId]);

    useWatch(() => {
        connectToMap();
    }, [ownerContext.mapId, mapServer]);

    /**
     * load map define when mapkind has changed.
     */
    useMounted(() => {
        const h = addListener('ChangeMapKind', async(mapKind: MapKind) => {
            if (currentMapKind === mapKind) {
                return;
            }
            await loadMapDefine(mapKind);
            loadEvents();
        });

        return () => {
            removeListener(h);
        }
    })

    const { removeItems } = useItem();
    const { subscribe, unsubscribe } = useSubscribe();
    useWatch(() => {
        if (!currentMapKind) return;

        subscribe('mapitem-update', () => {
            doCommand({
                command: "LoadLatestData",
                param: undefined,
            });
        });
        subscribe('mapitem-delete', (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        if (onMapKindChangedRef.current) {
            onMapKindChangedRef.current({
                mapKind: currentMapKind,
            });
        }

        return () => {
            unsubscribe('mapitem-update');
            unsubscribe('mapitem-delete');
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
    const selectedItemIds = useRecoilValue(selectedItemIdsState);
    const { disabledContentDialog } = useContext(OwnerContext);
    useWatch(() => {
        if (onSelectRef.current) {
            onSelectRef.current(selectedItemIds);
        }
        if (selectedItemIds.length === 1 && !disabledContentDialog) {
            // 詳細ダイアログ表示
            doCommand({
                command: 'ShowItemInfo',
                param: selectedItemIds[0],
            });
        }
    }, [selectedItemIds]);

    /**
     * callback when map mode has changed.
     */
    const mapMode = useRecoilValue(mapModeState);
    useEffect(() => {
        if (onModeChangedRef.current) {
            onModeChangedRef.current(mapMode);
        }
    }, [mapMode]);

    /**
     * callback when categories has loaded or changed.
     */
    // const categories = useRecoilValue(categoryState);
    // useEffect(() => {
    //     console.log('category changed', categories);
    //     if (onCategoriesLoadedRef.current) {
    //         onCategoriesLoadedRef.current(categories);
    //     }
    // }, [categories]);

    /**
     * callback when events has loaded or changed.
     */
    const { events } = useEvent();
    useEffect(() => {
        if(onEventsLoadedRef.current) {
            onEventsLoadedRef.current(events);
        }
    }, [events]);

    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const resetFilteredItems = useResetRecoilState(filteredItemsState);
    const { search } = useSearch();

    /**
     * set filter
     */
    useWatch(() => {
        if (ownerContext.filter && ownerContext.filter.conditions.length > 0) {
            search(ownerContext.filter.conditions);
        } else {
            resetFilteredItems();
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
            const { errorMessage, button } = function(): {errorMessage: string; button?: ButtonInProcess } {
                switch(connectStatus.error.type) {
                    case 'UndefinedMapServer':
                        return {
                            errorMessage: '地図サーバーに接続できません'
                        };
                    case ErrorType.UndefinedMap:
                        return {
                            errorMessage: '指定の地図は存在しません'
                        };
                    case ErrorType.Unauthorized:
                        return {
                            errorMessage: 'この地図を表示するには、ログインが必要です'
                        }
                    case ErrorType.Forbidden:
                        return {
                            errorMessage: '認証期限が切れている可能性があります。再ログインを試してください。問題が解決しない場合は、管理者へ問い合わせてください。'
                        };
                    case ErrorType.NoAuthenticate:
                        return {
                            errorMessage: 'この地図に入るには管理者の承認が必要です',
                            button: ButtonInProcess.Request,
                        };
                    case ErrorType.Requesting:
                        return {
                            errorMessage: '管理者からの承認待ちです'
                        }
                    case ErrorType.SessionTimeout:
                        return {
                            errorMessage: 'しばらく操作されなかったため、セッション接続が切れました。再ロードしてください。'
                        };
                    default:
                        return {
                            errorMessage: '想定外の問題が発生しました。再ロードしても問題が解決しない場合は、管理者へ問い合わせてください。'
                        };
                }
            }();
            const detail = connectStatus.error.detail ? `\n${connectStatus.error.detail}` : '';
            messageIdRef.current = showProcessMessage({
                overlay: true,
                spinner: false,
                message: errorMessage + detail,
                button,
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
    const isShowOverlay = useRecoilValue(isShowOverlayState);
    const isShowSpinner = useRecoilValue(isShowSpinnerState);
    const processMessage = useRecoilValue(processMessageState);

    const others = useMemo(() => {
        if (!processMessage?.button) return null;
        switch(processMessage.button) {
            case ButtonInProcess.Request:
                return <RequestComponet />
        }
    }, [processMessage]);

    return (
        <div className={`${isShowOverlay ? styles.Overlay : styles.MinOverlay}`}>
            {isShowSpinner &&
                <div className={styles.GraphSpinner}>
                    <Spinner size={isShowOverlay ? 'normal' : 'small'} />
                </div>
            }
            {processMessage?.message &&
                <p className={styles.Message}>{processMessage.message}</p>
            }
            {others}
        </div>
    )
}

/**
 * 登録申請コンポーネント
 * @returns 
 */
function RequestComponet() {
    const { getApi } = useMap();
    const { mapId } = useContext(OwnerContext);
    const [ stage, setStage ] = useState<'button' | 'input' | 'requested'>('button');
    const [ name, setName ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();

    const onRequest = useCallback(async() => {
        if (name.length === 0) {
            setErrorMessage('名前を入力してください');
            return;
        }
        setStage('requested');
        await getApi().callApi(RequestAPI, {
            mapId,
            name,
        });
    }, [getApi, mapId, name]);

    switch(stage) {
        case 'button':
            return <Button variant='secondary' onClick={()=>setStage('input')}>登録申請</Button>

        case 'input':
            return (
                <div>
                    <div>
                        <Input type="text" placeholder='名前' value={name} onChange={(evt)=>setName(evt.target.value)} />
                        <Button variant='secondary' onClick={onRequest}>登録申請</Button>
                    </div>
                    <div className={styles.ErrorMessage}>
                        {errorMessage}
                    </div>
                </div>
            )

        case 'requested':
            return (
                <div className={styles.RequestedMessage}>登録申請しました。承認されるまで、しばらくお待ちください。</div>
            )
    }
}

export default React.forwardRef(MapWrapper);
