import { FeatureLike } from 'ol/Feature';
import { useCallback } from 'react';
import { Stroke, Style } from 'ol/style';

/**
 * 軌跡Featureのスタイルを設定するフック
 * @param props 
 */
export default function useTrackStyle() {
    const trackStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const type = feature.getGeometry()?.getType();
        const isSelect = (feature.getProperties().select === true);
        let width = 5;

        switch(type) {
            case 'LineString':
            case 'MultiLineString':
            case 'GeometryCollection':
                if (isSelect) {
                    width = 7;
                } else if(feature.getProperties()['type']) {
                    width = 7;
                }
                return new Style({
                    stroke: new Stroke({
                        color: '#f5b461',
                        width,
                    })
                });
            default:
                return new Style();
        }
    }, [])

    return {
        trackStyleFunction,
    }
}