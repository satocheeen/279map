import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { loadCategories, loadEvents } from '../../store/data/dataThunk';
import { useFilter } from '../../store/useFilter';
import { addListener, removeListener } from '../../util/Commander';
import { usePrevious } from '../../util/usePrevious';
import MapChart from './MapChart';
import useSession from './useSession';
import { operationActions, PopupTarget } from '../../store/operation/operationSlice';
import OverlaySpinner from '../common/spinner/OverlaySpinner';
import { openItemContentsPopup } from '../popup/popupThunk';
import { OwnerContext } from './TsunaguMap';
import { sessionActions } from '../../store/session/sessionSlice';

export default function MapWrapper() {
    const ownerContext = useContext(OwnerContext);
    const mapId = useSelector((state: RootState) => state.data.mapId);
    const mapKind = useMemo(() => ownerContext.mapKind, [ownerContext]);
    const mapName = useSelector((state: RootState) => {
        return state.data.mapName;
    });

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(sessionActions.setMapServer(ownerContext.mapServer));
    }, [ownerContext.mapServer, dispatch]);

    useSession({
        mapId: ownerContext.mapId,
    });
    useInitializePopup();

    // TODO: セッション確立してない場合は、実行しないように制御
    const loadLatestData = useCallback(() => {
        dispatch(loadEvents());
        dispatch(loadCategories());
    }, [dispatch]);

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
     * 地図が切り替わったら再ロード
     */
    useEffect(() => {
        loadLatestData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapId, mapKind]);

    useEffect(() => {
        if (ownerContext.onLoaded) {
            ownerContext.onLoaded({
                mapName,
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapName]);

    /**
     * 選択アイテムが変更されたらコールバック
     */
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    useEffect(() => {
        if (selectedItemIds.length > 0) {
            if (ownerContext.onSelect) {
                ownerContext.onSelect(selectedItemIds);
            }    
        } else {
            if (ownerContext.onUnselect) {
                ownerContext.onUnselect();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItemIds]);

    return (
        <>
            <MapChart />
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
