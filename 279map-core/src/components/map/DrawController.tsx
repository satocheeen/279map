import React, { lazy, Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { ItemGeoInfo, MapMode, TsunaguMapHandler } from '../../types/types';
import EditTopographyInfoController from './draw-controller/topography/EditTopographyInfoController';
import LoadingOverlay from '../common/spinner/LoadingOverlay';
import { mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { FeatureType } from '../../types-common/common-types';
import DrawTemporaryFeatureController from './draw-controller/common/DrawTemporaryFeatureController';
import useItemProcess from '../../store/item/useItemProcess';

const DrawStructureController = lazy(() => import('./draw-controller/structure/DrawStructureController'));
const MoveItemController = lazy(() => import('./draw-controller/structure/MoveItemController'));
const DrawTopographyController = lazy(() => import('./draw-controller/topography/DrawTopographyController'));
const RemoveItemController = lazy(() => import('./draw-controller/common/RemoveItemController'));
const DrawRoadController = lazy(() => import('./draw-controller/topography/DrawRoadController'));
const EditItemController = lazy(() => import('./draw-controller/common/EditItemController'));

type Props = {
}

type ControllerType = {
    type: 'draw-structure' | 'draw-road';
    dataSourceId: string;
} | {
    type: 'move-structure' | 'edit-topography-info';
} | {
    type: 'draw-topography';
    dataSourceId: string;
    featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
} | {
    type: 'remove-item' | 'edit-item';
    featureTypes: FeatureType[];
} | {
    type: 'draw-temporary-feature';
    featureType: FeatureType;
    onCommit: (geometry: ItemGeoInfo) => void;
    onCancel: () => void;
}
export type DrawControllerHandler = Pick<TsunaguMapHandler, 
    'drawTemporaryFeature'
    | 'registItemDirectly'
    | 'updateItemDirectly'
    | 'removeItemDircetly'
    | 'drawStructure'
    | 'moveStructure'
    | 'editItem'
    | 'removeItem'
    | 'drawTopography'
    | 'drawRoad'
    | 'editTopographyInfo'
    >;

function DrawController({}: Props, ref: React.ForwardedRef<DrawControllerHandler>) {
    const [mapMode, setMapMode] = useAtom(mapModeAtom);
    const [controller, setController] = useState<ControllerType|undefined>();
    const { registItem: registItemProcess, updateItems: updateItemsProcess, removeItem: removeItemProcess } = useItemProcess();

    const terminate = useCallback(() => {
        setController(undefined);
        setMapMode(MapMode.Normal);
    }, [setMapMode])

    useImperativeHandle(ref, () => ({
        drawTemporaryFeature(featureType: FeatureType) {
            return new Promise<ItemGeoInfo|null>((resolve) => {
                setMapMode(MapMode.Drawing);
                setController({
                    type: 'draw-temporary-feature',
                    featureType,
                    onCommit(geometry) {
                        setController(undefined);
                        setMapMode(MapMode.Normal);
                        resolve(geometry);
                    },
                    onCancel() {
                        setController(undefined);
                        setMapMode(MapMode.Normal);
                        resolve(null);
                    }
                });
            })
        },
        async registItemDirectly(datasourceId, geo, name) {
            const id = await registItemProcess({
                datasourceId,
                geometry: geo.geometry,
                geoProperties: geo.geoProperties,
                name,
            });
            if (!id) {
                throw new Error('registItem failed');
            }
            return id;
        },
        async updateItemDirectly(id, geo, name) {
            await updateItemsProcess([
                {
                    id,
                    geometry: geo?.geometry,
                    geoProperties: geo?.geoProperties,
                    name,
                }
            ]);
        },
        async removeItemDircetly(id) {
            await removeItemProcess(id);
        },
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
        editItem(targets: FeatureType[]) {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'edit-item',
                featureTypes: targets,
            })
        },
        removeItem(targets: FeatureType[]) {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'remove-item',
                featureTypes: targets,
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
        editTopographyInfo() {
            setMapMode(MapMode.Drawing);
            setController({
                type: 'edit-topography-info',
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
        case 'edit-item':
            if (controller)
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    {/* <ChangeStructureIconController close={terminate} /> */}
                    <EditItemController target={controller.featureTypes} close={terminate} />
                </Suspense>
            )
        case 'remove-item':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <RemoveItemController target={controller.featureTypes} close={terminate} />
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
        case 'edit-topography-info':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <EditTopographyInfoController close={terminate} />
                </Suspense>
            )
        case 'draw-temporary-feature':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawTemporaryFeatureController
                        featureType={controller.featureType}
                        onCancel={controller.onCancel} onCommit={controller.onCommit} />
                </Suspense>
            )
    }

}
export default React.forwardRef(DrawController);
