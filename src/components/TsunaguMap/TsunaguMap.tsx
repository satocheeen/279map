import { api, MapKind } from '279map-common';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import { DefaultIconDefine } from '../../types/types';
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

    onConnect?: (mapDefine: api.ConnectResult) => void;
    onSelect?: (targets: string[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
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