import React, { lazy, Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { ItemGeoInfo, MapMode, SystemIconDefine, TsunaguMapHandler } from '../../types/types';
import LoadingOverlay from '../common/spinner/LoadingOverlay';
import { mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { DataId, FeatureType, IconKey } from '../../types-common/common-types';
import useItemProcess from '../../store/item/useItemProcess';
import { currentMapIconDefineAtom } from '../../store/icon';
import { geometry } from '@turf/turf';

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
    type: 'edit-item';
    featureTypes: FeatureType[];
    iconFunction?: (icons: SystemIconDefine[]) => Promise<IconKey|'cancel'>;
    onCommit: (id: DataId, geometry: ItemGeoInfo) => Promise<void>;
    onCancel: () => void;
} | {
    type: 'remove-item';
    featureTypes: FeatureType[];
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
    const { removeItem: removeItemProcess, updateItems } = useItemProcess();
    const [ icons ] = useAtom(currentMapIconDefineAtom);

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
                        // TODO: アイコンを指定可能なデータソースかどうかをチェック
                        if (param.iconFunction) {
                            param.iconFunction(icons).then(result => {
                                if (result === 'cancel') {
                                    resolve(null);
                                    return;
                                }
                                setController({
                                    type: 'draw-point',
                                    dataSourceId: param.datasourceId,
                                    iconKey: result,
                                    onCommit,
                                    onCancel,
                                })
                            })
                        } else {
                            setController({
                                type: 'draw-point',
                                dataSourceId: param.datasourceId,
                                onCommit,
                                onCancel,
                            })
                        }
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
        editItem(param) {
            return new Promise<void>((resolve) => {
                setMapMode(MapMode.Drawing);

                setController({
                    type: 'edit-item',
                    featureTypes: param.targets,
                    iconFunction: param.iconFunction,
                    onCommit: async(id, geometry) => {
                        setController(undefined);
                        setMapMode(MapMode.Normal);

                        await updateItems([
                            {
                                id,
                                geometry: geometry.geometry,
                                geoProperties: geometry.geoProperties,
                            }
                        ])

                        resolve();

                    },
                    onCancel: () => {
                        setController(undefined);
                        setMapMode(MapMode.Normal);
                        resolve();
                    },
                })
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
                    <EditItemController target={controller.featureTypes}
                        iconFunction={controller.iconFunction}
                        onCancel={controller.onCancel} onCommit={controller.onCommit} />
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
    }

}
export default React.forwardRef(DrawController);
