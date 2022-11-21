import React from 'react';
import ReactDOM from 'react-dom/client';
import TestMap from './driver/TestMap';

/**
 * for Debelopment
 * 動作確認用
 */
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <TestMap />
    </React.StrictMode>
);
