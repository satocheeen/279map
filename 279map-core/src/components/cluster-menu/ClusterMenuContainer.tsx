import React, { useCallback, useRef } from 'react';
import { dialogTargetAtom, doShowClusterMenuAtom, mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { MapMode } from '../../types/types';
import { DataId, FeatureType } from '279map-common';
import ClusterMenuController, { ClusterMenuControllerHandler } from './ClusterMenuController';
import { useMap } from '../map/useMap';
import { useAtomCallback } from 'jotai/utils';

export default function ClusterMenuContainer() {
    const { map } = useMap();
    const [ mapMode ] = useAtom(mapModeAtom);
    const controllerRef = useRef<ClusterMenuControllerHandler>(null);
    const [ doShowClusterMenu, setDoShowClusterMenu ] = useAtom(doShowClusterMenuAtom);

    const onSelectItem = useAtomCallback(
        useCallback((get, set, feature: DataId | undefined) => {
            if (!feature) {
                set(dialogTargetAtom, undefined);
            } else {
                set(dialogTargetAtom, {
                    type: 'item',
                    id: feature
                });
            }
        }, [])
    );

    if (doShowClusterMenu && controllerRef.current) {
        controllerRef.current.showClusterMenu(doShowClusterMenu);
        setDoShowClusterMenu(undefined);
    }

    if (!map || mapMode !== MapMode.Normal) return null;

    return (
        <ClusterMenuController
            ref={controllerRef}
            targets={[FeatureType.STRUCTURE, FeatureType.AREA]}
            onSelect={onSelectItem} />
    );
}