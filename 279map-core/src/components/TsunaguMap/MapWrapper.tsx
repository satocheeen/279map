import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { loadCategories, loadEvents } from '../../store/data/dataThunk';
import { useFilter } from '../../store/useFilter';
import { addListener, removeListener } from '../../util/Commander';
import { usePrevious } from '../../util/usePrevious';
import MapChart from './MapChart';
import { operationActions, PopupTarget } from '../../store/operation/operationSlice';
import { openItemContentsPopup } from '../popup/popupThunk';
import { OwnerContext } from './TsunaguMap';
import { sessionActions } from '../../store/session/sessionSlice';
import { connectMap, loadMapDefine } from '../../store/session/sessionThunk';
import { useOverlay } from '../common/spinner/useSpinner';
import { useCommand } from '../../api/useCommand';
import styles from './MapWrapper.module.scss';
import { ConnectAPIResult } from '../../types/types';
import { ErrorType } from 'tsunagumap-api';
import Spinner from '../common/spinner/Spinner';

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
export default function MapWrapper() {
    const ownerContext = useContext(OwnerContext);
    const connectStatus = useSelector((state: RootState) => state.session.connectStatus);
    const currentMapKindInfo = useSelector((state: RootState) => state.session.currentMapKindInfo);
    const spinner = useOverlay();

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onUnselectRef = useRef<typeof ownerContext.onUnselect>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(sessionActions.setMapServer({
            domain: ownerContext.mapServer.host,
            ssl: ownerContext.mapServer.ssl,
            token: ownerContext.token,
        }));
    }, [ownerContext.mapServer, ownerContext.token, dispatch]);

    useEffect(() => {
        onConnectRef.current = ownerContext.onConnect;
        onMapKindChangedRef.current = ownerContext.onMapLoad;
        onSelectRef.current = ownerContext.onSelect;
        onUnselectRef.current = ownerContext.onUnselect;
        onModeChangedRef.current = ownerContext.onModeChanged;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    useInitializePopup();

    const mapServer = useSelector((state: RootState) => state.session.mapServer);

    /**
     * 初回処理
     */
    useEffect(() => {
        const h = addListener('LoadLatestData', async() => {
            await dispatch(loadEvents());
            await dispatch(loadCategories());
        });
        return () => {
            removeListener(h);
        }

    }, [dispatch, mapServer]);

    const commandHook = useCommand();
    /**
     * connect to map
     */
    useEffect(() => {
        if (mapServer.domain.length === 0) return;

        // connect
        dispatch(connectMap({
            mapId: ownerContext.mapId,
            token: ownerContext.token,
        }))
        .then((res) => {
            const result = res.payload as ConnectAPIResult;
            if (onConnectRef.current) {
                if (result.result === 'success') {
                    onConnectRef.current({
                        result: 'success',
                        mapDefine: result.connectResult.mapDefine,
                        commandHook,
                    });
                } else {
                    onConnectRef.current({
                        result: 'failure',
                        error: result.error,
                    });
                }
            }
        })
        .catch(err => {
            console.warn('connect error', err);
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, ownerContext.mapId, ownerContext.token, mapServer]);

    const currentMapKind = useSelector((state: RootState) => state.operation.currentMapKind);
    /**
     * load map define when connected map or mapkind has changed.
     */
    useEffect(() => {
        if (connectStatus.status !== 'connected') {
            return;
        }
        const mapKind = currentMapKind ?? connectStatus.connectedMap.defaultMapKind;
        if (currentMapKindInfo?.mapKind === mapKind) {
            return;
        }
        dispatch(loadMapDefine(mapKind));
        // loadLatestData();
    }, [connectStatus, currentMapKind, currentMapKindInfo, dispatch]);

    useEffect(() => {
        if (!currentMapKindInfo) return;

        if (onMapKindChangedRef.current) {
            onMapKindChangedRef.current({
                mapKind: currentMapKindInfo.mapKind,
                dataSources: currentMapKindInfo.dataSources,
            });
        }
    }, [currentMapKindInfo]);

    /**
     * 選択アイテムが変更されたらコールバック
     */
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    useEffect(() => {
        if (selectedItemIds.length > 0) {
            if (onSelectRef.current) {
                onSelectRef.current(selectedItemIds);
            }
        } else {
            if (onUnselectRef.current) {
                onUnselectRef.current();
            }
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
    const categories = useSelector((state: RootState) => state.data.categories);
    useEffect(() => {
        if (onCategoriesLoadedRef.current) {
            onCategoriesLoadedRef.current(categories);
        }
    }, [categories]);

    /**
     * callback when events has loaded or changed.
     */
    const events = useSelector((state: RootState) => state.data.events);
    useEffect(() => {
        if(onEventsLoadedRef.current) {
            onEventsLoadedRef.current(events);
        }
    }, [events]);

    /**
     * set filter
     */
    useEffect(() => {
        if (ownerContext.filter && ownerContext.filter.length > 0) {
            dispatch(operationActions.setFilter(ownerContext.filter));
        } else {
            dispatch(operationActions.clearFilter());
        }
    }, [ownerContext.filter, dispatch]);

    useEffect(() => {
        if (connectStatus.status === 'connecting-map') {
            spinner.showSpinner('ロード中...')
        } else if (connectStatus.status === 'failure') {
            spinner.hideSpinner();
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
            spinner.showOverlayMessage(errorMessage + detail);
        } else if (currentMapKindInfo) {
            spinner.hideSpinner();
        }
    }, [connectStatus, currentMapKindInfo, spinner]);

    return (
        <>
            {currentMapKindInfo &&
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
    const isShow = useSelector((state: RootState) => state.operation.overlay.spinner || state.operation.overlay.message);
    const showSpinner = useSelector((state: RootState) => state.operation.overlay.spinner);
    const message = useSelector((state: RootState) => {
        return state.operation.overlay.message ?? '';
    });

    if (!isShow) {
        return null;
    }

    return (
        <div className={styles.Overlay}>
            {showSpinner &&
                <div className={styles.GraphSpinner}>
                    <Spinner />
                </div>
            }
            <p>{message}</p>
        </div>
    )
}

function useInitializePopup() {
    const { filterTargetContentIds } = useFilter();
    const dispatch = useAppDispatch();

    /**
     * フィルター設定変更時の処理
     * - フィルター設定時
     *   - フィルター強調対象のFeatureの吹き出しを表示する
     *   - 対象外のFeatureの吹き出しは非表示に
     * - フィルター解除時は、一律吹き出し非表示に
     */
     const prevFilterTargetContentIds = usePrevious(filterTargetContentIds);
     useEffect(() => {
        if (prevFilterTargetContentIds && filterTargetContentIds) {
            if (JSON.stringify(prevFilterTargetContentIds) === JSON.stringify(filterTargetContentIds)) {
                return;
            }
        }
        // フィルター対象を抽出する
        if (filterTargetContentIds === undefined) {
            // dispatch(operationActions.clearPopup());
        } else {
            const param = filterTargetContentIds.map(contentId => {
                return {
                    type: 'content',
                    contentId,
                } as PopupTarget;
            });
            dispatch(openItemContentsPopup(param));
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterTargetContentIds]);


}
