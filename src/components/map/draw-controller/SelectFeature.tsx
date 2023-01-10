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
import { FeatureType, MapKind } from '279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { useFilter } from '../../../store/useFilter';
import { Geometry } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import ClusterMenu from '../../cluster-menu/ClusterMenu';

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

type ClusterMenuInfo = {
    position: Coordinate;
    targets: Feature[];
    // itemIds: string[];
}

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

    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuInfo|null>(null);

    const { filteredItemIdList } = useFilter();
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion
    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
    }, [filteredItemIdList]);

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
            console.log('select', evt.selected);
            if (evt.selected.length === 0) {
                setSelectedFeature(undefined);
                return;
            }

            let points = [] as Feature<Geometry>[];
            const features = evt.selected[0].get('features') as Feature<Geometry>[];
            features.forEach(feature => {
                const id = feature.getId() as string | undefined;
                if (id !== undefined) {
                    points.push(feature);
                }
            });
            // フィルタ時はフィルタ対象外のものに絞る
            if (filteredItemIdListRef.current) {
                points = points.filter(point => filteredItemIdListRef.current?.includes(point.getId() as string));
            }
            if (points.length === 0) {
                setSelectedFeature(undefined);
                return;
            } else if (points.length === 1) {
                setSelectedFeature(points[0]);
                return;
            }

            // 対象が複数存在する場合またはコンテンツを持たないアイテムの場合は、重畳選択メニューを表示
            // 表示位置
            const ext = evt.selected[0].getGeometry()?.getExtent();
            if (!ext) {
                console.warn('position undefined');
                return;
            }

            setClusterMenuInfo({
                position: ext,
                targets: points,
            });

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

    const onClusterMenuSelected = useCallback((id: string) => {
        const target = clusterMenuInfo?.targets.find(t => t.getId() === id);

        setSelectedFeature(target);
        setClusterMenuInfo(null);
    }, [clusterMenuInfo?.targets]);

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
        <>
            <PromptMessageBox
                message={message}
                ok={onOkClicked} cancel={onCancel}
                okdisabled={selectedFeature === undefined} />
        
            {clusterMenuInfo &&
                <ClusterMenu map={props.map} position={clusterMenuInfo.position}
                    itemIds={clusterMenuInfo.targets.map(target=>target.getId() as string)}
                    onSelect={onClusterMenuSelected} />
            }
        </>
    );
}