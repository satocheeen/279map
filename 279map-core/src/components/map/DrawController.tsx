import React, { lazy, Suspense, useEffect, useState } from 'react';
import { addListener, removeListener } from '../../util/Commander';
import { MapMode } from '../../types/types';
import EditTopographyInfoController from './draw-controller/topography/EditTopographyInfoController';
import { FeatureType } from '279map-common';
import { LayerType } from '../TsunaguMap/VectorLayerMap';
import LoadingOverlay from '../common/spinner/LoadingOverlay';
import { useSetRecoilState } from 'recoil';
import { mapModeState } from '../../store/operation/operationAtom';

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
    const setMapMode = useSetRecoilState(mapModeState);

    useEffect(() => {
        const terminate = () => {
            setDrawController(undefined);
            setMapMode(MapMode.Normal);
        };
    
        const listenerH = [] as number[];
        listenerH.push(
            addListener('DrawStructure', async(dataSourceId: string) => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <DrawStructureController dataSourceId={dataSourceId} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('MoveStructure', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <MoveItemController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('ChangeStructure', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <ChangeStructureIconController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('RemoveStructure', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <RemoveFeatureController target={LayerType.Point} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('DrawTopography', async(param: {dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA }) => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <DrawTopographyController dataSourceId={param.dataSourceId} drawFeatureType={param.featureType} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('DrawRoad', async(dataSourceId: string) => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <DrawRoadController dataSourceId={dataSourceId} close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('EditTopography', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <EditTopographyController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('EditTopographyInfo', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <EditTopographyInfoController close={terminate} />
                    </Suspense>
                );
            })
        );
        listenerH.push(
            addListener('RemoveTopography', async() => {
                setMapMode(MapMode.Drawing);
                setDrawController(
                    <Suspense fallback={<LoadingOverlay />}>
                        <RemoveFeatureController target={LayerType.Topography} close={terminate} />
                    </Suspense>
                );
            })
        );

        return () => {
            listenerH.forEach(h => removeListener(h));
        }
    }, [setMapMode]);

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
