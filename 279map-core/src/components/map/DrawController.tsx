import React, { lazy, Suspense, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { addListener, removeListener } from '../../util/Commander';
import { MapMode, TsunaguMapHandler } from '../../types/types';
import EditTopographyInfoController from './draw-controller/topography/EditTopographyInfoController';
import { FeatureType } from '279map-common';
import { LayerType } from '../TsunaguMap/VectorLayerMap';
import LoadingOverlay from '../common/spinner/LoadingOverlay';
import { mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';

const DrawStructureController = lazy(() => import('./draw-controller/structure/DrawStructureController'));
const MoveItemController = lazy(() => import('./draw-controller/structure/MoveItemController'));
const DrawTopographyController = lazy(() => import('./draw-controller/topography/DrawTopographyController'));
const RemoveFeatureController = lazy(() => import('./draw-controller/common/RemoveFeatureController'));
const ChangeStructureIconController = lazy(() => import('./draw-controller/structure/ChangeStructureIconController'));
const DrawRoadController = lazy(() => import('./draw-controller/topography/DrawRoadController'));
const EditTopographyController = lazy(() => import('./draw-controller/topography/EditTopographyController'));

type Props = {
}

type ControllerType = {
    type: 'draw-structure' | 'draw-road';
    dataSourceId: string;
} | {
    type: 'move-structure' | 'change-structure' | 'remove-structure' | 'edit-topography' | 'edit-topography-info' | 'remove-topography';
} | {
    type: 'draw-topography';
    dataSourceId: string;
    featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
}
export type DrawControllerHandler = Pick<TsunaguMapHandler, 
    'drawStructure'
    | 'moveStructure'
    | 'changeStructure'
    | 'removeStructure'
    | 'drawTopography'
    | 'drawRoad'
    | 'editTopography'
    | 'editTopographyInfo'
    | 'removeTopography'>;

function DrawController({}: Props, ref: React.ForwardedRef<DrawControllerHandler>) {
    const [mapMode, setMapMode] = useAtom(mapModeAtom);
    const [controller, setController] = useState<ControllerType|undefined>();

    const terminate = useCallback(() => {
        setController(undefined);
        setMapMode(MapMode.Normal);
    }, [setMapMode])

    useImperativeHandle(ref, () => ({
        drawStructure(dataSourceId: string) {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'draw-structure',
                dataSourceId,
            });
        },
        moveStructure() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'move-structure',
            })
        },
        changeStructure() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'change-structure',
            })
        },
        removeStructure() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'remove-structure',
            })
        },
        drawTopography(dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA) {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'draw-topography',
                dataSourceId,
                featureType,
            })
        },
        drawRoad(dataSourceId: string) {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'draw-road',
                dataSourceId,
            })
        },
        editTopography() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'edit-topography',
            })
        },
        editTopographyInfo() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'edit-topography-info',
            })
        },
        removeTopography() {
            setMapMode(MapMode.Drawing);
            setController({
                type:'remove-topography',
            })
        },
    }));

    if (!controller) {
        return null;
    }

    switch(controller.type) {
        case 'draw-structure':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawStructureController dataSourceId={controller.dataSourceId} close={terminate} />
                </Suspense>
            )
        case 'move-structure':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <MoveItemController close={terminate} />
                </Suspense>

            )
        case 'change-structure':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <ChangeStructureIconController close={terminate} />
                </Suspense>
            )
        case 'remove-structure':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <RemoveFeatureController target={LayerType.Point} close={terminate} />
                </Suspense>
            )
        case 'draw-topography':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawTopographyController dataSourceId={controller.dataSourceId} drawFeatureType={controller.featureType} close={terminate} />
                </Suspense>
            )
        case 'draw-road':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawRoadController dataSourceId={controller.dataSourceId} close={terminate} />
                </Suspense>
            )
        case 'edit-topography':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <EditTopographyController close={terminate} />
                </Suspense>
            )
        case 'edit-topography-info':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <EditTopographyInfoController close={terminate} />
                </Suspense>
            )
        case 'remove-topography':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <RemoveFeatureController target={LayerType.Topography} close={terminate} />
                </Suspense>
            )
    }

}
export default React.forwardRef(DrawController);
