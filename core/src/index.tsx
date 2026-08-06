import React from 'react';
import ReactDOM from 'react-dom/client';
import DriverRoot from './driver/DriverRoot';

/**
 * for Debelopment
 * 動作確認用
 */
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <DriverRoot />
    </React.StrictMode>
);
