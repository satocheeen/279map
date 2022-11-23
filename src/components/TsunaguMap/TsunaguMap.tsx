import { api, MapKind } from '279map-common';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import { DefaultIconDefine, MapInfo, MapMode, ServerInfo } from '../../types/types';
import MapWrapper from './MapWrapper';

export type TsunaguMapProps = {
    mapId: string;
    mapServer: ServerInfo;
    iconDefine?: DefaultIconDefine[];
    mapKind: MapKind;  // which view Real or Virtual.
    disablePopup?: boolean; // when true, the map don't show popup.

    onConnect?: (mapDefine: api.ConnectResult) => void;
    onSelect?: (targets: string[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
    onLoaded?: (mapInfo: MapInfo) => void;  // callback when map data has loaded.
    onChangeMode?: (mode: MapMode) => void; // callback when map mode change.
}

export const OwnerContext = React.createContext<TsunaguMapProps>({
    mapId: '',
    mapServer: {
        domain: '',
        ssl: true,
    },
    iconDefine: [],
    mapKind: MapKind.Real,
});
export default function TsunaguMap(props: TsunaguMapProps) {
    return (
        <OwnerContext.Provider value={props}>
            <Provider store={store}>
                <MapWrapper />
            </Provider>
        </OwnerContext.Provider>
    );
}