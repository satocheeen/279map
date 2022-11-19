import React from 'react';
import ReactDOM from 'react-dom/client';
import TsunaguMap from './components/TsunaguMap';

/**
 * for Debelopment
 * 動作確認用
 */
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
const mapServer = {
    domain: 'localhost',
    ssl: false,
}
const mapId = 'map';
root.render(
    <React.StrictMode>
        <div style={{height: '100vh', width: '100vw', border: '1px solid #aaa'}}>
            <TsunaguMap mapId={mapId} mapServer={mapServer} />
        </div>
    </React.StrictMode>
);
