import { Feature, MapBrowserEvent } from 'ol';
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
import { FeatureType, MapKind } from '279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { colorWithAlpha } from '../../../util/CommonUtility';

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
const AREA_STROKE_COLOR = '#aaaaff';
const AREA_FILL_COLOR = '#aaaaff';
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
    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    // 初期化
    useEffect(() => {
        const styleFunction = function(){
            if (props.target === 'topography') {
                const selectedStyleFunc = (feature: FeatureLike) => {
                    const featureType = feature.getProperties()['featureType'];
                    let strokeColor;
                    let fillColor = '';
                    let alpha = 1;
                    switch(featureType) {
                        case FeatureType.FOREST:
                            strokeColor = FOREST_STROKE_COLOR;
                            fillColor = FOREST_FILL_COLOR;
                            break;
                        case FeatureType.AREA:
                            strokeColor = AREA_STROKE_COLOR;
                            fillColor = AREA_FILL_COLOR;
                            alpha = 0.3;
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
                            color: colorWithAlpha(fillColor, alpha),
                        }),
                    });
                }
                return  topographyStyleHook.getStyleFunction(selectedStyleFunc);
            } else {
                return pointStyleHook.selectedStyleFunction;
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
            filter: (feature) => {
                if (props.target === 'topography') {
                    return true;
                }
                const features = feature.get('features') as FeatureLike[];
                // 複数重なっているものは選択不可
                return features.length === 1;
            },
        });
        select.current.on('select', (evt: SelectEvent) => {
            if (evt.selected.length === 0) {
                setSelectedFeature(undefined);
                return;
            }
            if (props.target === 'structure') {
                const features = evt.selected[0].get('features') as Feature[];
                setSelectedFeature(features[0]);
            } else{
                setSelectedFeature(evt.selected[0]);
            }
        });
        props.map.addInteraction(select.current);

        // 選択可能な地図上アイテムhover時にポインター表示
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            let isHover = false;
            props.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                const layerName = layer.getProperties()['name'];
                if (props.target === 'structure' && layerName !== 'itemLayer') {
                    return;
                }
                if (props.target === 'topography' && layerName !== 'topographyLayer') {
                    return;
                }
                if (layerName === 'itemLayer') {
                    const features = feature.get('features') as FeatureLike[];
                    if (features.length === 1) {
                        isHover = true;
                        return;
                    }
                } else if(layerName === 'topographyLayer') {
                    isHover = true;
                }
            });
            if (isHover) {
                props.map.getTargetElement().style.cursor = 'pointer';
            } else {
                props.map.getTargetElement().style.cursor = '';
            }
        };
        props.map.on('pointermove', pointerMoveEvent);


        return () => {
            if (select.current) {
                props.map.removeInteraction(select.current);
            }
            props.map.un('pointermove', pointerMoveEvent);
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