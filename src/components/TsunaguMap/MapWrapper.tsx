import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { loadCategories, loadEvents } from '../../store/data/dataThunk';
import { useFilter } from '../../store/useFilter';
import { addListener, removeListener } from '../../util/Commander';
import { usePrevious } from '../../util/usePrevious';
import MapChart from './MapChart';
// import useSession from './useSession';
import { operationActions, PopupTarget } from '../../store/operation/operationSlice';
import OverlaySpinner from '../common/spinner/OverlaySpinner';
import { openItemContentsPopup } from '../popup/popupThunk';
import { OwnerContext } from './TsunaguMap';
import { sessionActions } from '../../store/session/sessionSlice';
import { useCallbackWrapper } from '../../util/useCallbackWrapper';
import { connectMap, loadMapDefine } from '../../store/session/sessionThunk';
import { MapInfo } from '../../entry';
import { useSpinner } from '../common/spinner/useSpinner';

export default function MapWrapper() {
    const ownerContext = useContext(OwnerContext);
    const connectedMap = useSelector((state: RootState) => state.session.connectedMap);
    const ownerMapKind = useMemo(() => ownerContext.mapKind, [ownerContext]);
    const currentMapKindInfo = useSelector((state: RootState) => state.session.currentMapKindInfo);
    const spinner = useSpinner();

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(sessionActions.setMapServer({
            domain: ownerContext.mapServerHost,
            ssl: true,
        }));
    }, [ownerContext.mapServerHost, dispatch]);

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
            // TODO: auth
        }))
    }, [dispatch, ownerContext.mapId]);

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

    const onLoaded = useCallbackWrapper<MapInfo, void>(ownerContext.onLoaded);

    useEffect(() => {
        if (!connectedMap) return;
        onLoaded.call({
            mapName: connectedMap.name,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectedMap]);

    /**
     * 選択アイテムが変更されたらコールバック
     */
    const onSelect = useCallbackWrapper(ownerContext.onSelect);
    const onUbnselect = useCallbackWrapper<undefined, void>(ownerContext.onUnselect);
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    useEffect(() => {
        if (selectedItemIds.length > 0) {
            onSelect.call(selectedItemIds);
        } else {
            onUbnselect.call(undefined);
        }
    }, [selectedItemIds, onSelect.call, onUbnselect.call]);

    useEffect(() => {
        if (currentMapKindInfo) {
            spinner.hideSpinner();
        } else {
            spinner.showSpinner('ロード中...')
        }
    }, [currentMapKindInfo]);

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
