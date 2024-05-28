import React, { lazy, Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { ItemGeoInfo, MapMode, TsunaguMapHandler } from '../../types/types';
import LoadingOverlay from '../common/spinner/LoadingOverlay';
import { mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { FeatureType, IconKey } from '../../types-common/common-types';
import DrawTemporaryFeatureController from './draw-controller/common/DrawTemporaryFeatureController';
import useItemProcess from '../../store/item/useItemProcess';

const DrawPointController = lazy(() => import('./draw-controller/structure/DrawPointController'));
const MoveItemController = lazy(() => import('./draw-controller/structure/MoveItemController'));
const DrawTopographyController = lazy(() => import('./draw-controller/topography/DrawTopographyController'));
const RemoveItemController = lazy(() => import('./draw-controller/common/RemoveItemController'));
const DrawRoadController = lazy(() => import('./draw-controller/topography/DrawRoadController'));
const EditItemController = lazy(() => import('./draw-controller/common/EditItemController'));

type Props = {
}

type ControllerType = {
    type: 'draw-point';
    dataSourceId: string;
    iconKey?: IconKey;
    onCommit: (geometry: ItemGeoInfo) => void;
    onCancel: () => void;
} | {
    type: 'draw-road';
    dataSourceId: string;
    onCommit: (geometry: ItemGeoInfo) => void;
    onCancel: () => void;
} | {
    type: 'draw-topography';
    dataSourceId: string;
    featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    onCommit: (geometry: ItemGeoInfo) => void;
    onCancel: () => void;
} | {
    type: 'move-structure';
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
    | 'removeData'
    | 'moveStructure'
    | 'editItem'
    | 'removeItem'
    >;

function DrawController({}: Props, ref: React.ForwardedRef<DrawControllerHandler>) {
    const [mapMode, setMapMode] = useAtom(mapModeAtom);
    const [controller, setController] = useState<ControllerType|undefined>();
    const { removeItem: removeItemProcess } = useItemProcess();

    const terminate = useCallback(() => {
        setController(undefined);
        setMapMode(MapMode.Normal);
    }, [setMapMode])

    useImperativeHandle(ref, () => ({
        drawTemporaryFeature(param) {
            return new Promise<ItemGeoInfo|null>((resolve) => {
                setMapMode(MapMode.Drawing);

                const onCommit = (geometry: ItemGeoInfo) => {
                    setController(undefined);
                    setMapMode(MapMode.Normal);
                    resolve(geometry);
                };
                const onCancel = () => {
                    setController(undefined);
                    setMapMode(MapMode.Normal);
                    resolve(null);
                }
                switch(param.featureType) {
                    case FeatureType.STRUCTURE:
                        setController({
                            type: 'draw-point',
                            dataSourceId: param.datasourceId,
                            iconKey: param.icon,
                            onCommit,
                            onCancel,
                        })
                        break;
                    case FeatureType.ROAD:
                        setController({
                            type: 'draw-road',
                            dataSourceId: param.datasourceId,
                            onCommit,
                            onCancel,
                        })
                        break;
                    case FeatureType.AREA:
                    case FeatureType.FOREST:
                    case FeatureType.EARTH:
                        setController({
                            type: 'draw-topography',
                            dataSourceId: param.datasourceId,
                            featureType: param.featureType,
                            onCommit,
                            onCancel,
                        })
                        break;
                }
            })
        },

        async removeData(id) {
            await removeItemProcess(id);
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
    }));

    if (!controller) {
        return null;
    }

    switch(controller.type) {
        case 'draw-point':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawPointController dataSourceId={controller.dataSourceId}
                        iconKey={controller.iconKey}
                        onCancel={controller.onCancel} onCommit={controller.onCommit} />
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
                    <DrawTopographyController dataSourceId={controller.dataSourceId} drawFeatureType={controller.featureType}
                        onCancel={controller.onCancel} onCommit={controller.onCommit} />
                </Suspense>
            )
        case 'draw-road':
            return (
                <Suspense fallback={<LoadingOverlay />}>
                    <DrawRoadController dataSourceId={controller.dataSourceId}
                        onCancel={controller.onCancel} onCommit={controller.onCommit} />
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
