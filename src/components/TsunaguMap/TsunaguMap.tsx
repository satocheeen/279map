import { api, CategoryDefine, EventDefine, MapKind } from '279map-common';
import React from 'react';
import { Provider } from 'react-redux';
import { FilterDefine } from '../../entry';
import { store } from '../../store/configureStore';
import { DefaultIconDefine, MapMode } from '../../types/types';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
// import ConfirmDialog from '../common/confirm/ConfirmDialog';

export type TsunaguMapProps = {
    mapId: string;
    mapServerHost: string;
    auth?: string;
    iconDefine?: DefaultIconDefine[];
    mapKind?: MapKind;  // which view Real or Virtual.
    disabledPopup?: boolean; // when true, the map don't show popup.
    disabledLabel?: boolean; // when true, the item's label hidden.

    filter?: FilterDefine[];

    onConnect?: (mapDefine: api.ConnectResult) => void;
    onSelect?: (targets: string[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.
}

export const OwnerContext = React.createContext<TsunaguMapProps>({
    mapId: '',
    mapServerHost: '',
    iconDefine: [],
    mapKind: MapKind.Real,
});
export default function TsunaguMap(props: TsunaguMapProps) {
    return (
        <>
            <OwnerContext.Provider value={props}>
                <Provider store={store}>
                    <div className={styles.TsunaguMap}>
                        <MapWrapper />
                    </div>
                </Provider>
            </OwnerContext.Provider>
            {/* <ConfirmDialog /> */}
        </>
    );
}