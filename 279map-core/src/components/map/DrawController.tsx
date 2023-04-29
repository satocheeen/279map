import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Map } from 'ol';
import { addListener, removeListener } from '../../util/Commander';
import { useDispatch } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { MapMode } from '../../types/types';
import OverlaySpinner from '../common/spinner/OverlaySpinner';
import EditTopographyInfoController from './draw-controller/topography/EditTopographyInfoController';
import { FeatureType } from '../../279map-common';
import { MapChartContext } from '../TsunaguMap/MapChart';
import { LayerType } from '../TsunaguMap/VectorLayerMap';

const DrawStructureController = lazy(() => import('./draw-controller/structure/DrawStructureController'));
const MoveItemController = lazy(() => import('./draw-controller/structure/MoveItemController'));
const DrawTopographyController = lazy(() => import('./draw-controller/topography/DrawTopographyController'));
const RemoveFeatureController = lazy(() => import('./draw-controller/common/RemoveFeatureController'));
const ChangeStructureIconController = lazy(() => import('./draw-controller/structure/ChangeStructureIconController'));
const DrawRoadController = lazy(() => import('./draw-controller/topography/DrawRoadController'));
const EditTopographyController = lazy(() => import('./draw-controller/topography/EditTopographyController'));

type Props = {
    onStart?: () => void;   // Drawモード開始時に実行するコールバック
    onEnd?:() => void;      // Drawモード終了時に実行するコールバック
}

export default function DrawController(props: Props) {
    const [drawController, setDrawController] = useState(undefined as JSX.Element | undefined);
    const dispatch = useDispatch();
    const { map } = useContext(MapChartContext);

    useEffect(() => {
        const terminate = () => {
            setDrawController(undefined);
            dispatch(operationActions.changeMapMode(MapMode.Normal));
        };
    
        const listenerH = [] as number[];
        listenerH.push(
            addListener('DrawStructure', async(dataSourceId: string) => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner message='準備中...' />}>
                        <DrawStructureController dataSourceId={dataSourceId} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('MoveStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner message='準備中...' />}>
                        <MoveItemController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('ChangeStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner message='準備中...' />}>
                        <ChangeStructureIconController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('RemoveStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner message='準備中...' />}>
                        <RemoveFeatureController target={LayerType.Point} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('DrawTopography', async(param: {dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA }) => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner message='準備中...' />}>
                        <DrawTopographyController dataSourceId={param.dataSourceId} drawFeatureType={param.featureType} close={terminate} />
                    </Suspense>
                );
            })
        );
        // listenerH.push(
        //     addListener('DrawRoad', async() => {
        //         dispatch(operationActions.changeMapMode(MapMode.Drawing));
        //         setDrawController(
        //             <Suspense fallback={<OverlaySpinner message='準備中...' />}>
        //                 <DrawRoadController map={map} close={terminate} />
        //             </Suspense>
        //         );
        //     })
        // );
        // listenerH.push(
        //     addListener('EditTopography', async() => {
        //         dispatch(operationActions.changeMapMode(MapMode.Drawing));
        //         setDrawController(
        //             <Suspense fallback={<OverlaySpinner message='準備中...' />}>
        //                 <EditTopographyController map={map} close={terminate} />
        //             </Suspense>
        //         );
        //     })
        // );
        // listenerH.push(
        //     addListener('EditTopographyInfo', async() => {
        //         dispatch(operationActions.changeMapMode(MapMode.Drawing));
        //         setDrawController(
        //             <Suspense fallback={<OverlaySpinner message='準備中...'/>}>
        //                 <EditTopographyInfoController map={map} close={terminate} />
        //             </Suspense>
        //         );
        //     })
        // );
        // listenerH.push(
        //     addListener('RemoveTopography', async() => {
        //         dispatch(operationActions.changeMapMode(MapMode.Drawing));
        //         setDrawController(
        //             <Suspense fallback={<OverlaySpinner  message='準備中...'/>}>
        //                 <RemoveFeatureController map={map} target="topography" close={terminate} />
        //             </Suspense>
        //         );
        //     })
        // );

        return () => {
            listenerH.forEach(h => removeListener(h));
        }
    }, [dispatch, map]);

    useEffect(() => {
        if (drawController !== undefined) {
            if (props.onStart) {
                props.onStart();
            }
        } else {
            if (props.onEnd) {
                props.onEnd();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawController]);

    if (drawController === undefined) {
        return null;
    } else {
        return drawController;
    }
}
