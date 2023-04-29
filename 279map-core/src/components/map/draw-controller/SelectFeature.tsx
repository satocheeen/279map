import { Feature, MapBrowserEvent } from 'ol';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { FeatureType, MapKind } from '../../../279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { colorWithAlpha } from '../../../util/CommonUtility';
import { MapStyles } from '../../../util/constant-defines';
import { MapChartContext } from '../../TsunaguMap/MapChart';
import { LayerType } from '../../TsunaguMap/VectorLayerMap';

type Props = {
    targetType: LayerType;
    message?: string;
    onOk: (feature: Feature) => void;
    onCancel: () => void;
}

/**
 * 編集対象のFeatureを選択させるコンポーネント
 * @param props 
 * @returns 
 */
export default function SelectFeature(props: Props) {
    const select = useRef<Select>();
    const [selectedFeature, setSelectedFeature] = useState<Feature>();
    const topographyStyleHook = useTopographyStyle({});
    const { map } = useContext(MapChartContext);
    const pointStyleHook = usePointStyle({ map });
    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    const targetLayers = useMemo((): VectorLayer<VectorSource>[] => {
        const layers = map.getLayersOfTheType(props.targetType);
        // 編集可能なレイヤに絞って返す
        return layers.filter(l => l.editable).map(l => l.layer);
    }, [props.targetType, map]);

    // 初期化
    useEffect(() => {
        const styleFunction = function(){
            if (props.targetType === LayerType.Topography) {
                const selectedStyleFunc = (feature: FeatureLike) => {
                    const featureType = feature.getProperties()['featureType'];
                    let strokeColor;
                    let fillColor = '';
                    let alpha: number;
                    let zIndex: number;
                    switch(featureType) {
                        case FeatureType.FOREST:
                            strokeColor = MapStyles.Forest.selectedColor.stroke;
                            fillColor = MapStyles.Forest.selectedColor.fill;
                            alpha = MapStyles.Forest.selectedColor.alpha;
                            zIndex = MapStyles.Forest.zIndex;
                            break;
                        case FeatureType.AREA:
                            strokeColor = MapStyles.Area.selectedColor.stroke;
                            fillColor = MapStyles.Area.selectedColor.fill;
                            alpha = MapStyles.Area.selectedColor.alpha;
                            zIndex = MapStyles.Area.zIndex;
                            break;
                        case FeatureType.ROAD:
                            strokeColor = MapStyles.Road.selectedColor.stroke;
                            fillColor = MapStyles.Road.selectedColor.fill;
                            alpha = MapStyles.Road.selectedColor.alpha;
                            zIndex = MapStyles.Road.zIndex;
                            break;
                        default:
                            strokeColor = MapStyles.Earth.selectedColor.stroke;
                            fillColor = MapStyles.Earth.selectedColor.fill;
                            alpha = MapStyles.Earth.selectedColor.alpha;
                            zIndex = MapStyles.Earth.zIndex;
                        }
                    return new Style({
                        stroke: new Stroke({
                            color: strokeColor,
                            width: 3,
                        }),
                        fill: new Fill({
                            color: colorWithAlpha(fillColor, alpha),
                        }),
                        zIndex,
                    });
                }
                return  topographyStyleHook.getStyleFunction(selectedStyleFunc);
            } else {
                return pointStyleHook.selectedStyleFunction;
            }
        }();
        select.current = new Select({
            condition: click,
            layers: targetLayers,
            style: styleFunction,
            filter: (feature) => {
                if (props.targetType !== LayerType.Point) {
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
            if (props.targetType === LayerType.Point) {
                const features = evt.selected[0].get('features') as Feature[];
                setSelectedFeature(features[0]);
            } else{
                setSelectedFeature(evt.selected[0]);
            }
        });
        map.addInteraction(select.current);

        // 選択可能な地図上アイテムhover時にポインター表示
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            let isHover = false;
            const targets = map.getNearlyFeatures(evt.pixel);
            targets.forEach(target => {
                const layerTypes = map.getLayerTypeOfTheDataSource(target.dataSourceId);
                if (layerTypes.includes(props.targetType)) {
                    isHover = true;
                }
            })
            if (isHover) {
                map.setCursorStyle('pointer');
            } else {
                map.setCursorStyle('');
            }
        };
        map.on('pointermove', pointerMoveEvent);


        return () => {
            if (select.current) {
                map.removeInteraction(select.current);
            }
            map.un('pointermove', pointerMoveEvent);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const message= useMemo(() => {
        let name: string;
        if (props.targetType === LayerType.Point) {
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
    }, [props.message, props.targetType, mapKind]);

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