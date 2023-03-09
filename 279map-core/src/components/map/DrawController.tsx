import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Map } from 'ol';
import { addListener, removeListener } from '../../util/Commander';
import { useDispatch } from 'react-redux';
import { operationActions } from '../../store/operation/operationSlice';
import { MapMode } from '../../types/types';
import OverlaySpinner from '../common/spinner/OverlaySpinner';
import EditTopographyInfoController from './draw-controller/topography/EditTopographyInfoController';
import { FeatureType } from '../../279map-common';

const DrawStructureController = lazy(() => import('./draw-controller/structure/DrawStructureController'));
const MoveItemController = lazy(() => import('./draw-controller/structure/MoveItemController'));
const DrawTopographyController = lazy(() => import('./draw-controller/topography/DrawTopographyController'));
const RemoveFeatureController = lazy(() => import('./draw-controller/common/RemoveFeatureController'));
const ChangeStructureIconController = lazy(() => import('./draw-controller/structure/ChangeStructureIconController'));
const DrawRoadController = lazy(() => import('./draw-controller/topography/DrawRoadController'));
const EditTopographyController = lazy(() => import('./draw-controller/topography/EditTopographyController'));

type Props = {
    map: Map;
    onStart?: () => void;   // Drawモード開始時に実行するコールバック
    onEnd?:() => void;      // Drawモード終了時に実行するコールバック
}

export default function DrawController(props: Props) {
    const [drawController, setDrawController] = useState(undefined as JSX.Element | undefined);
    const dispatch = useDispatch();

    useEffect(() => {
        const terminate = () => {
            setDrawController(undefined);
            dispatch(operationActions.changeMapMode(MapMode.Normal));
        };
    
        const listenerH = [] as number[];
        listenerH.push(
            addListener('DrawStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <DrawStructureController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('MoveStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <MoveItemController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('ChangeStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <ChangeStructureIconController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('RemoveStructure', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <RemoveFeatureController map={props.map} target="structure" close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('DrawTopography', async(featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA) => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <DrawTopographyController map={props.map} drawFeatureType={featureType} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('DrawRoad', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <DrawRoadController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('EditTopography', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <EditTopographyController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('EditTopographyInfo', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <EditTopographyInfoController map={props.map} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('RemoveTopography', async() => {
                dispatch(operationActions.changeMapMode(MapMode.Drawing));
                setDrawController(
                    <Suspense fallback={<OverlaySpinner />}>
                        <RemoveFeatureController map={props.map} target="topography" close={terminate} />
                    </Suspense>
                );
            })
        );

        return () => {
            listenerH.forEach(h => removeListener(h));
        }
    }, [dispatch, props.map]);

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
