import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapChart from './MapChart';

export interface TsunaguMapProps {
    mapId: string;
}

export default function TsunaguMap(props: TsunaguMapProps) {
    return (
        <Provider store={store}>
            <MapChart />
        </Provider>
    );
}