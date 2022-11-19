import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { loadCategories, loadEvents } from '../../store/data/dataThunk';
import { addListener, removeListener } from '../../util/Commander';
import MapChart from './MapChart';
import { MapInfo } from './TsunaguMap';
import useSession from './useSession';

type Props = {
    mapId: string;
    onLoaded?: (mapInfo: MapInfo) => void;
}

export default function MapWrapper(props: Props) {
    const mapId = useSelector((state: RootState) => state.data.mapId);
    const mapKind = useSelector((state: RootState) => state.data.mapKind);
    const mapName = useSelector((state: RootState) => {
        return state.data.mapName;
    });

    const dispatch = useAppDispatch();
    useSession({
        mapId: props.mapId,
    });

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
        if (props.onLoaded) {
            props.onLoaded({
                mapName,
            })
        }
    }, [mapName, props]);

    return (
        <MapChart />
    );
}