import React from 'react';

export interface MapChartProps {
    label: string;
}

const MapChart = (props: MapChartProps) => {
    return (
        <div>{props.label}</div>
    )
}

export default MapChart;
