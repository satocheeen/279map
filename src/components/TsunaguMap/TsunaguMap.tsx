import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import { DefaultIconDefine, MapInfo, MapMode, ServerInfo } from '../../types/types';
import MapWrapper from './MapWrapper';

export type TsunaguMapProps = {
    mapId: string;
    mapServer: ServerInfo;
    iconDefine?: DefaultIconDefine[];
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