import React, { useCallback } from 'react';
import { mapModeAtom, showingDetailItemIdAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { MapMode } from '../../types/types';
import { DataId, FeatureType } from '279map-common';
import ClusterMenuController from './ClusterMenuController';
import { useMap } from '../map/useMap';
import { useAtomCallback } from 'jotai/utils';

export default function ClusterMenuContainer() {
    const { map } = useMap();
    const [ mapMode ] = useAtom(mapModeAtom);

    const onSelectItem = useAtomCallback(
        useCallback((get, set, feature: DataId | undefined) => {
            if (!feature) {
                set(showingDetailItemIdAtom, null);
            } else {
                set(showingDetailItemIdAtom, feature);
            }
        }, [])
    );

    if (!map || mapMode !== MapMode.Normal) return null;

    return (
        <ClusterMenuController
            targets={[FeatureType.STRUCTURE, FeatureType.AREA]}
            onSelect={onSelectItem} />
    );
}