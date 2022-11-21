import { MapKind } from '279map-common';
import React from 'react';
import ReactDOM from 'react-dom/client';
import TsunaguMap from './components/TsunaguMap';
import { TsunaguMapProps } from './components/TsunaguMap/TsunaguMap';

/**
 * for Debelopment
 * 動作確認用
 */
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const props = {
    mapServer: {
        domain: 'otakaramap.satocheeen.com',
        ssl: true,
        // domain: 'localhost',
        // ssl: false,
    },
    mapId: 'otakaramap',
    // mapId: 'test',
    iconDefine: [
        {
            id: 'pin',
            imagePath: '/icon/pin.png',
            useMaps: [MapKind.Real],
            menuViewCustomCss: {
                filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
            },
            defaultColor: '#aaa',
        },
        {
            id: 'school',
            imagePath: '/icon/house.png',
            useMaps: [MapKind.Virtual],
        },
    ],
        
} as TsunaguMapProps;

root.render(
    <React.StrictMode>
        <div style={{height: '100vh', width: '100vw', border: '1px solid #aaa'}}>
            <TsunaguMap {...props} />
        </div>
    </React.StrictMode>
);
