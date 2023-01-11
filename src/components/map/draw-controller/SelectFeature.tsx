import { Feature } from 'ol';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptMessageBox from './PromptMessageBox';
import Style, { StyleFunction, StyleLike } from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Map } from 'ol';
import { FeatureLike } from 'ol/Feature';
import useTopographyStyle from '../useTopographyStyle';
import usePointStyle from '../usePointStyle';
import { FeatureType, MapKind } from '279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { useFilter } from '../../../store/useFilter';
import { Coordinate } from 'ol/coordinate';
import ClusterMenuController from '../../cluster-menu/ClusterMenuController';
import { Geometry } from 'ol/geom';

type Props = {
    map: Map;   // コントロール対象の地図
    target: 'topography' | 'structure';
    message?: string;
    onOk: (feature: FeatureLike) => void;
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
}

/**
 * 編集対象のFeatureを選択させるコンポーネント
 * @param props 
 * @returns 
 */
export default function SelectFeature(props: Props) {
    const [selectedFeature, setSelectedFeature] = useState<Feature>();
    const selectedFeatureRef = useRef<Feature>();
    useEffect(() => {
        selectedFeatureRef.current = selectedFeature;
        props.map.render();
    }, [selectedFeature, props.map]);

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

    const { filteredItemIdList } = useFilter();
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion
    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
    }, [filteredItemIdList]);

    // useEffect(() => {
    //     const layerName = props.target === 'topography' ? 'topographyLayer' : 'itemLayer';
    //     const layer = props.map.getAllLayers().find(layer => {
    //         return layer.getProperties()['name'] === layerName;
    //     }) as VectorLayer<VectorSource>;
    //     const originalStyleFunction = layer.getStyleFunction();

    //     const selectedStyleFunction = function(){
    //         if (props.target === 'topography') {
    //             const selectedStyleFunc = (feature: FeatureLike, resolution: number, defaultStyle: Style) => {
    //                 const featureType = feature.getProperties()['featureType'];
    //                 let strokeColor;
    //                 let fillColor;
    //                 switch(featureType) {
    //                     case FeatureType.FOREST:
    //                         strokeColor = FOREST_STROKE_COLOR;
    //                         fillColor = FOREST_FILL_COLOR;
    //                         break;
    //                     default:
    //                         strokeColor = EARTH_STROKE_COLOR;
    //                         fillColor = EARTH_FILL_COLOR;
    //                 }
    //                 return new Style({
    //                     stroke: new Stroke({
    //                         color: strokeColor,
    //                         width: 3,
    //                     }),
    //                     fill: new Fill({
    //                         color: fillColor,
    //                     }),
    //                 });
    //             }
    //             return  topographyStyleHook.getStyleFunction(selectedStyleFunc);
    //         } else {
    //             const selectedColorFunc = (feature: FeatureLike): {color?: string; alpha?: number} => {
    //                 return {
    //                     color: STRUCTURE_COLOR,
    //                     alpha: 1,
    //                 };
    //             };
    //             // TODO:
    //             return pointStyleHook.getStructureStyleFunction(selectedColorFunc);        
    //         }
    //     }();

    //     const styleFunction: StyleFunction = (feature: FeatureLike, resolution: number) => {
    //         let isSelectedFeature = selectedFeatureRef.current === feature;
    //         if (props.target === 'structure') {
    //             const features = feature.get('features') as FeatureLike[];
    //             console.log('features', features, selectedFeatureRef.current?.getId());
    //             isSelectedFeature = features.some(f => selectedFeatureRef.current?.getId() === f.getId());
    //         }
    //         if (!isSelectedFeature) {
    //             if (originalStyleFunction) {
    //                 return originalStyleFunction(feature, resolution);
    //             } else {
    //                 return;
    //             }
    //         }
    //         console.log('selectedStyleFunction');
    //         return selectedStyleFunction(feature, resolution);
    //     }

    //     layer.setStyle(styleFunction);

    //     // select.current = new Select({
    //     //     condition: click,
    //     //     layers: [layer],
    //     //     style: styleFunction,
    //     //     addCondition: (evt) => {
    //     //         console.log('debug', evt);

    //     //         evt.t
    //     //         return true;
    //     //     }
    //     // });

    //     // const clickFunc = (evt: MapBrowserEvent<any>) => {
    //     //     // 重畳選択メニュー用に位置を保存
    //     //     lastClickCoordinateRef.current = evt.coordinate;
    //     // }
    //     // props.map.on('click', clickFunc);

    //     // select.current.on('select', (evt: SelectEvent) => {
    //     //     console.log('select', evt.selected);
    //     //     setClusterMenuInfo(null);
    //     //     if (evt.selected.length === 0) {
    //     //         setSelectedFeature(undefined);
    //     //         return;
    //     //     }

    //     //     let points = [] as Feature<Geometry>[];
    //     //     const features = evt.selected[0].get('features') as Feature<Geometry>[];
    //     //     features.forEach(feature => {
    //     //         const id = feature.getId() as string | undefined;
    //     //         if (id !== undefined) {
    //     //             points.push(feature);
    //     //         }
    //     //     });
    //     //     // フィルタ時はフィルタ対象外のものに絞る
    //     //     if (filteredItemIdListRef.current) {
    //     //         points = points.filter(point => filteredItemIdListRef.current?.includes(point.getId() as string));
    //     //     }
    //     //     if (points.length === 0) {
    //     //         setSelectedFeature(undefined);
    //     //         return;
    //     //     } else if (points.length === 1) {
    //     //         setSelectedFeature(points[0]);
    //     //         return;
    //     //     }

    //     //     // 対象が複数存在する場合またはコンテンツを持たないアイテムの場合は、重畳選択メニューを表示
    //     //     // 表示位置
    //     //     const ext = evt.selected[0].getGeometry()?.getExtent();
    //     //     if (!lastClickCoordinateRef.current) {
    //     //         console.warn('position undefined');
    //     //         return;
    //     //     }
    //     //     // アイコン画像サイズ分、上にずらす
    //     //     // const styleLike = evt.selected[0].getStyle() as StyleFunction;
    //     //     // const resolution = props.map.getView().getResolution();
    //     //     // if (styleLike && resolution) {
    //     //     //     const style = styleLike(points[0], resolution) as Style;
    //     //     //     // const imageSize = style.getImage().getImageSize();
    //     //     //     const imageSize = [90, 90];
    //     //     //     const scale = style.getImage().getScale() as number;
    //     //     //     const offsetY = imageSize ? - (imageSize[1] / 1.6 * scale) : 0;
    //     //     //     console.log('imageSize', imageSize, 'offsetY', offsetY);
    //     //     //     ext[1] -= offsetY;
    //     //     // }


    //     //     setClusterMenuInfo({
    //     //         position: lastClickCoordinateRef.current,
    //     //         targets: points,
    //     //     });

    //     // });
    //     // props.map.addInteraction(select.current);

    //     return () => {
    //         console.log('unmounted');
    //         layer.setStyle(originalStyleFunction);
    //         // if (select.current) {
    //         //     props.map.removeInteraction(select.current);
    //         // }
    //     }
    //  // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

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

    const onSelect = useCallback((feature: Feature | undefined) => {
        if (selectedFeature) {
            selectedFeature.setProperties({
                selected: false,
            })
        }
        setSelectedFeature(feature);
        pointStyleHook.setSelectedFeature(feature);
        feature?.setProperties({
            selected: true,
        })
        props.map.render();
    }, [pointStyleHook]);

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
        
            <ClusterMenuController
                map={props.map}
                onSelect={onSelect} />
        </>
    );
}