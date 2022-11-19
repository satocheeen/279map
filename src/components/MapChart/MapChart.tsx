import React from 'react';
import styles from './MapChart.module.scss';

export interface MapChartProps {
    label: string;
}

const MapChart = (props: MapChartProps) => {
    return (
        <div className={styles.Container}>
            <p>Version 2</p>
            <p>{props.label}</p>
        </div>
    )
}

export default MapChart;
