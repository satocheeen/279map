import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';

export type MapInfo = {
    mapName: string;
}
export type TsunaguMapProps = {
    mapId: string;
    onLoaded?: (mapInfo: MapInfo) => void;
}

export default function TsunaguMap(props: TsunaguMapProps) {
    return (
        <Provider store={store}>
            <MapWrapper mapId={props.mapId} onLoaded={props.onLoaded} />
        </Provider>
    );
}