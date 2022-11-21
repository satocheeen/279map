import { Feature } from 'ol';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptMessageBox from './PromptMessageBox';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import { Map } from 'ol';
import { FeatureLike } from 'ol/Feature';
import useTopographyStyle from '../useTopographyStyle';
import usePointStyle from '../usePointStyle';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { FeatureType, MapKind } from '279map-common';

type Props = {
    map: Map;   // コントロール対象の地図
    target: 'topography' | 'structure';
    message?: string;
    onOk: (feature: Feature) => void;
    onCancel: () => void;
}

const EARTH_STROKE_COLOR = '#dd9C00';
const EARTH_FILL_COLOR = '#d5d2c9';
const FOREST_STROKE_COLOR = '#509B50';
const FOREST_FILL_COLOR = '#969B8A';
const STRUCTURE_COLOR = '#8888ff';

/**
 * 編集対象のFeatureを選択させるコンポーネント
 * @param props 
 * @returns 
 */
export default function SelectFeature(props: Props) {
    const select = useRef<Select>();
    const [selectedFeature, setSelectedFeature] = useState<Feature>();
    const itemLayer = useMemo(() => {
        return props.map.getAllLayers().find(layer => {
            return layer.getProperties()['name'] === 'itemLayer';
        }) as VectorLayer<VectorSource>;
    }, [props.map]);
    const topographyStyleHook = useTopographyStyle({});
    const pointStyleHook = usePointStyle({
        structureLayer: itemLayer,
    });
    const mapKind = useSelector((state: RootState) => state.data.mapKind);

    useEffect(() => {
        const styleFunction = function(){
            if (props.target === 'topography') {
                const selectedStyleFunc = (feature: FeatureLike) => {
                    const featureType = feature.getProperties()['featureType'];
                    let strokeColor;
                    let fillColor;
                    switch(featureType) {
                        case FeatureType.FOREST:
                            strokeColor = FOREST_STROKE_COLOR;
                            fillColor = FOREST_FILL_COLOR;
                            break;
                        default:
                            strokeColor = EARTH_STROKE_COLOR;
                            fillColor = EARTH_FILL_COLOR;
                    }
                    return new Style({
                        stroke: new Stroke({
                            color: strokeColor,
                            width: 3,
                        }),
                        fill: new Fill({
                            color: fillColor,
                        }),
                    });
                }
                return  topographyStyleHook.getStyleFunction(selectedStyleFunc);
            } else {
                const selectedColorFunc = (feature: FeatureLike): {color?: string; alpha?: number} => {
                    return {
                        color: STRUCTURE_COLOR,
                        alpha: 1,
                    };
                };
                return pointStyleHook.getStructureStyleFunction(selectedColorFunc);        
            }
        }();
        const layerName = props.target === 'topography' ? 'topographyLayer' : 'itemLayer';
        const layer = props.map.getAllLayers().find(layer => {
            return layer.getProperties()['name'] === layerName;
        }) as VectorLayer<VectorSource>;
        select.current = new Select({
            condition: click,
            layers: [layer],
            style: styleFunction,
        });
        select.current.on('select', (evt: SelectEvent) => {
            if (evt.selected.length === 0) {
                setSelectedFeature(undefined);
            } else {
                setSelectedFeature(evt.selected[0]);
            }
        });
        props.map.addInteraction(select.current);

        return () => {
            console.log('unmounted');
            if (select.current) {
                props.map.removeInteraction(select.current);
            }
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const message= useMemo(() => {
        let name: string;
        if (props.target === 'structure') {
            if (mapKind === MapKind.Real) {
                name = '地点';
            } else {
                name = '建物';
            }
        } else {
            if (mapKind === MapKind.Real) {
                name = 'エリア';
            } else {
                name = '地形';
            }
        }
        return props.message ? props.message : `対象の${name}を選択して、OKボタンを押下してください。`;
    }, [props.message, props.target, mapKind]);

    const onOkClicked = useCallback(async() => {
        if (!selectedFeature) {
            console.warn('選択アイテムなし');
            return;
        }
        props.onOk(selectedFeature);
    }, [props, selectedFeature]);

    const onCancel = useCallback(() => {
        props.onCancel();
    }, [props]);

    return (
        <PromptMessageBox
            message={message}
            ok={onOkClicked} cancel={onCancel}
            okdisabled={selectedFeature === undefined} />
    );
}