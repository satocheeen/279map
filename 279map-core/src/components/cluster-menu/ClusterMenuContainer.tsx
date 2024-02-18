import React, { useCallback, useContext, useRef } from 'react';
import { selectItemIdAtom, doShowClusterMenuAtom, mapModeAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { MapMode } from '../../types/types';
import ClusterMenuController, { ClusterMenuControllerHandler } from './ClusterMenuController';
import { useMap } from '../map/useMap';
import { useAtomCallback } from 'jotai/utils';
import { DataId, FeatureType } from '../../types-common/common-types';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

export default function ClusterMenuContainer() {
    const { map } = useMap();
    const [ mapMode ] = useAtom(mapModeAtom);
    const controllerRef = useRef<ClusterMenuControllerHandler>(null);
    const [ doShowClusterMenu, setDoShowClusterMenu ] = useAtom(doShowClusterMenuAtom);
    const { onItemClick } = useContext(OwnerContext);

    const onSelectItem = useAtomCallback(
        useCallback((get, set, feature: DataId | undefined) => {
            if (!feature) {
                set(selectItemIdAtom, null);
            } else {
                set(selectItemIdAtom, feature);
            }
            if (feature && onItemClick) {
                onItemClick(feature);
            }
        }, [onItemClick])
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