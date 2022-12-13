import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { loadCategories, loadEvents } from '../../store/data/dataThunk';
import { useFilter } from '../../store/useFilter';
import { addListener, removeListener } from '../../util/Commander';
import { usePrevious } from '../../util/usePrevious';
import MapChart from './MapChart';
import { operationActions, PopupTarget } from '../../store/operation/operationSlice';
import OverlaySpinner from '../common/spinner/OverlaySpinner';
import { openItemContentsPopup } from '../popup/popupThunk';
import { OwnerContext } from './TsunaguMap';
import { sessionActions } from '../../store/session/sessionSlice';
import { connectMap, loadMapDefine } from '../../store/session/sessionThunk';
import { useSpinner } from '../common/spinner/useSpinner';
import { api } from '279map-common';

export default function MapWrapper() {
    const ownerContext = useContext(OwnerContext);
    const connectedMap = useSelector((state: RootState) => state.session.connectedMap);
    const ownerMapKind = useMemo(() => ownerContext.mapKind, [ownerContext]);
    const currentMapKindInfo = useSelector((state: RootState) => state.session.currentMapKindInfo);
    const spinner = useSpinner();

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onUnselectRef = useRef<typeof ownerContext.onUnselect>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(sessionActions.setMapServer({
            domain: ownerContext.mapServerHost,
            ssl: true,
        }));
    }, [ownerContext.mapServerHost, dispatch]);

    useEffect(() => {
        onConnectRef.current = ownerContext.onConnect;
        onSelectRef.current = ownerContext.onSelect;
        onUnselectRef.current = ownerContext.onUnselect;
        onModeChangedRef.current = ownerContext.onModeChanged;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    useInitializePopup();

   /**
     * 初回処理
     */
    useEffect(() => {
        const h = addListener('LoadLatestData', () => {
            dispatch(loadEvents());
            dispatch(loadCategories());
        });

        return () => {
            removeListener(h);
        }

    }, [dispatch]);

    /**
     * connect to map
     */
    useEffect(() => {
        // connect
        dispatch(connectMap({
            mapId: ownerContext.mapId,
            auth: ownerContext.auth,
        }))
        .then((res) => {
            if (onConnectRef.current) {
                onConnectRef.current(res.payload as api.ConnectResult);
            }
        })
    }, [dispatch, ownerContext.mapId, ownerContext.auth]);

    /**
     * load map define when connected map or mapkind has changed.
     */
    useEffect(() => {
        if (!connectedMap) {
            return;
        }
        const mapKind = ownerMapKind ?? connectedMap.defaultMapKind;
        dispatch(loadMapDefine(mapKind));
        // loadLatestData();
    }, [connectedMap, ownerMapKind, dispatch]);

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
    }, [ownerContext.filter]);

    useEffect(() => {
        if (currentMapKindInfo) {
            spinner.hideSpinner();
        } else {
            spinner.showSpinner('ロード中...')
        }
    }, [currentMapKindInfo, spinner]);

    return (
        <>
            {currentMapKindInfo &&
                <MapChart />
            }
            <MySpinner />
        </>
    );
}

function MySpinner() {
    const isShow = useSelector((state: RootState) => state.operation.showSpinner);
    const message = useSelector((state: RootState) => {
        return state.operation.spinnerMessage;
    });
    if (!isShow) {
        return null;
    }
    return (
        <OverlaySpinner message={message} />
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
            dispatch(operationActions.clearPopup());
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
