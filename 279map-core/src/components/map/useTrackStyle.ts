import { FeatureLike } from 'ol/Feature';
import { useCallback, useEffect, useRef } from 'react';
import VectorSource from "ol/source/Vector";
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { MapMode } from '../../types/types';
import { useMap } from './useMap';

/**
 * 軌跡Featureのスタイルを設定するフック
 * @param props 
 */
export default function useTrackStyle() {
    const { map } = useMap();
    const layersRef = useRef<VectorLayer<VectorSource>[]>([]);
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);

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

    useEffect(() => {
        if (mapMode === MapMode.Normal) {
            // console.log('setPointLayerStyle', instanceId);
            map?.setTrackLayerStyle(trackStyleFunction);
        }
    }, [trackStyleFunction, map, mapMode]);

    // const addLayer = useCallback((layer: VectorLayer<VectorSource>) => {
    //     layersRef.current.push(layer);
    //     layer.setStyle(trackStyleFunction);
    // }, [trackStyleFunction]);

    return {
        // addLayer,
    }
}