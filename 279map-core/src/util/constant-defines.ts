export const ProjectionRealMap = 'EPSG:4326';
export const ProjectionVirtualMap = 'EPSG:3857';

export const MapStyles = {
    Earth: {
        color: '#f5f2e9',
        selectedColor: {
            stroke: '#dd9C00',
            fill: '#d5d2c9',
            alpha: 1,
        },
        zIndex: 1,
    },
    Forest: {
        color: '#91CDA4',
        selectedColor: {
            stroke: '#509B50',
            fill: '#969B8A',
            alpha: 1,
        },
        zIndex: 2,
    },
    Road: {
        color: '#b1a560',
        selectedColor: {
            stroke: '#dd9C00',
            fill: '#d5d2c9',
            alpha: 1,
        },
        zIndex: 3,
    },
    Area: {
        color: '#aaa',
        selectedColor: {
            stroke: '#aaaaff',
            fill: '#aaaaff',
            alpha: 0.3,
        },
        zIndex: 1,
    },
    Item: {
        maxLabelLength: 15,     // 地図上に表示するラベル最大長
    }
}