import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchAddress, { SearchAddressHandler } from '../../../common/SearchAddress';
import { GeoJsonObject } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { Feature, Map } from 'ol';
import VectorSource from 'ol/source/Vector';
import { Form } from 'react-bootstrap';
import Button from '../../../common/button/Button';
import { convertKmToLonLat, getStructureScale } from '../../../../util/MapUtility';
import { Circle } from 'ol/geom';
import PromptMessageBox from '../PromptMessageBox';
import { Draw } from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import styles from './DrawPointRadius.module.scss';
import VectorLayer from 'ol/layer/Vector';
import useTopographyStyle from '../../useTopographyStyle';
import { Icon, Style } from 'ol/style';
import IconAnchorUnits from 'ol/style/IconAnchorUnits';
import useIcon from '../../../../store/useIcon';
import usePointStyle from '../../usePointStyle';
import { getDistance } from 'geolib';
import { FeatureType } from '../../../../279map-common';

type Props = {
    map: Map;   // コントロール対象の地図
    onCancel?: () => void;
    onOk?: (feature: Feature) => void;
}

enum Stage {
    SelectCenter,   // 住所入力か地図上クリックで中心点を決める
    DrawCircle,
}

const drawingSource = new VectorSource();

/**
 * 特定の住所を中心とした円エリアを作図するための部品
 * @param props 
 * @returns 
 */
export default function DrawPointRadius(props: Props) {
    const [stage, setStage] = useState(Stage.SelectCenter);
    // 中心位置
    const [centerCoordinates, setCenterCoordinates] = useState<[number, number]>();
    const [radius, setRadius] = useState(0);
    const [circleFeature, setCircleFeature] = useState<Feature>();

    const itemLayer = useMemo(() => {
        return props.map.getAllLayers().find(layer => layer.getProperties()['name'] === 'topographyLayer') as VectorLayer<VectorSource>;
    }, [props.map]);

    const draw = useRef<Draw|undefined>();
    const pointStyleHook = usePointStyle();
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.AREA,
        drawing: true,
    });
    const iconHook = useIcon();
    const searchAddressRef = useRef({} as SearchAddressHandler);
    const circleFreeDrawing = useRef(false);

    const isFit = useRef(false);    // 住所変更後にFitさせるかどうか（クリックの時にFitさせないように制御する用途）

    /**
     * 初期化
     */
     useEffect(() => {
        const drawingLayer = new VectorLayer({
            source: drawingSource,
            style: styleHook.getStyleFunction((feature, resolution, defaultStyle) => {
                const type = feature.getGeometry()?.getType();
                if (type === 'Point') {
                    const iconDefine = iconHook.getIconDefine();

                    const scale = getStructureScale(resolution);
                    return new Style({
                        image: new Icon({
                            anchor: [0.5, 1],
                            anchorXUnits: IconAnchorUnits.FRACTION,
                            anchorYUnits: IconAnchorUnits.FRACTION,
                            src: iconDefine.imagePath,
                            color: iconDefine.defaultColor,
                            opacity: 1,
                            scale,
                        }),
                        zIndex: 3,
                    });
                } else {
                    return defaultStyle;
                }

            }),
            zIndex: 10,
        });
        props.map.addLayer(drawingLayer);

        return () => {
            if (draw.current) {
                props.map.removeInteraction(draw.current);
            }
            drawingSource.clear();
            props.map.removeLayer(drawingLayer);
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

    // ステージ変更
    const startSelectCenter = useCallback(() => {
        const type = 'Point';
        const style = pointStyleHook.getDrawingStructureStyleFunction(iconHook.getIconDefine());

        // Circleは除去
        const circleFeature = drawingSource.getFeatures().find(feature => feature.getGeometry()?.getType() === 'Circle');
        if (circleFeature){
            drawingSource.removeFeature(circleFeature);
        }

        if (draw.current) {
            props.map.removeInteraction(draw.current);
        }
        draw.current = new Draw({
            source: drawingSource,
            type,
            style,
        });
        draw.current.on('drawend', (event: DrawEvent) => {
            drawingSource.clear();
            const extent = event.feature.getGeometry()?.getExtent();
            if (extent) {
                const center = extent.slice(0, 2) as [number, number];
                setCenterCoordinates(center);
                isFit.current = false;
                searchAddressRef.current.setAddress(center[1] + ',' + center[0]);
            }
        });
        props.map.addInteraction(draw.current);

    }, [pointStyleHook, props.map]);

    const startDrawCircle = useCallback(() => {
        const type = 'Circle';
        const style = styleHook.getStyleFunction();

        if (draw.current) {
            props.map.removeInteraction(draw.current);
        }
        if (!centerCoordinates) {
            return;
        }

        draw.current = new Draw({
            source: drawingSource,
            type,
            style,
            geometryFunction: (coords, geometry) => {
                if (!geometry) {
                    geometry = new Circle([0,0], 0);
                }
                const circleGeometry = geometry as Circle;
                const last = coords[1] as [number, number];
                console.log('center', centerCoordinates, last);
                const radius = Math.sqrt(Math.pow(centerCoordinates[0] - last[0], 2) + Math.pow(centerCoordinates[1] - last[1], 2));
                const distance = getDistance(centerCoordinates, last) / 1000;
                console.log('distance', distance);
                console.log('radius', radius, distance);
                circleGeometry.setCenter(centerCoordinates);
                circleGeometry.setRadius(radius);
                setRadius(distance);
    
                return circleGeometry;
            },
        });
        draw.current.setActive(true);
        draw.current.on('drawstart', (event: DrawEvent) => {
            circleFreeDrawing.current = true;
            // Circleは除去
            const circleFeature = drawingSource.getFeatures().find(feature => feature.getGeometry()?.getType() === 'Circle');
            if (circleFeature){
                drawingSource.removeFeature(circleFeature);
            }
            console.log('drawstart');
        });
        draw.current.on('drawend', (event: DrawEvent) => {
            circleFreeDrawing.current = false;
            console.log('drawend');
            setCircleFeature(event.feature);
        });
        props.map.addInteraction(draw.current);
    }, [styleHook, props.map, centerCoordinates]);
 
    useEffect(() => {
        if (stage === Stage.SelectCenter) {
            startSelectCenter();
        } else {
            startDrawCircle();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage]);

    const onSelectAddress = useCallback((geoJson: GeoJsonObject) => {
        const feature = new GeoJSON().readFeatures(geoJson)[0];
        drawingSource.clear();
        drawingSource.addFeature(feature);
        const extent = feature.getGeometry()?.getExtent();
        if (!extent) {
            console.warn('no extent');
            return;
        }
        if (isFit.current) {
            props.map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
            });
        } else {
            isFit.current = true;
        }
        setCenterCoordinates(extent.slice(0, 2) as [number, number]);
    }, [props.map]);


    const onInputRadius = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        const num = Number(val);
        if (isNaN(num)) {
            console.warn('no number');
            return;
        }
        setRadius(num);
    }, []);

    // 半径kmから半径円描画
    useEffect(() => {
        if (!centerCoordinates || circleFreeDrawing.current) {
            return;
        }
        // Circleは除去
        const circleFeature = drawingSource.getFeatures().find(feature => feature.getGeometry()?.getType() === 'Circle');
        if (circleFeature){
            drawingSource.removeFeature(circleFeature);
        }

        const r = convertKmToLonLat(centerCoordinates, radius);
        if (circleFeature) {
            drawingSource.removeFeature(circleFeature);
        }
        const circle = new Feature({
            geometry: new Circle(centerCoordinates, r),
        });
        drawingSource.addFeature(circle);
        setCircleFeature(circle);

        const extent = circle.getGeometry()?.getExtent();
        if (extent)
            props.map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radius]);

    const onCertainCenter = useCallback(() => {
        setStage(Stage.DrawCircle);
    }, []);

    const onOk = useCallback(() => {
        if (!props.onOk)
            return;
        if (!circleFeature) {
            console.warn('no circle');
            return;
        }
        props.onOk(circleFeature);
    }, [props, circleFeature]);

    return (
        <PromptMessageBox message='円エリア作図'
            cancelname='戻る'
            okdisabled={stage !== Stage.DrawCircle || radius === 0}
            ok={onOk}
            cancel={props.onCancel}>
            <div>
                <div className={`${styles.Phase} ${stage !== Stage.SelectCenter ? styles.Disabled : ''}`}>
                    <p>1. 任意の地点をクリックするか、住所検索してください.</p>
                    <SearchAddress map={props.map}
                        ref={searchAddressRef}
                        disabled={stage !== Stage.SelectCenter}
                        searchTarget={['point']}
                        onAddress={onSelectAddress} />
                    <Button variant="secondary"
                        onClick={onCertainCenter}
                        disabled={centerCoordinates===undefined}>確定</Button>
                </div>
                <div className={`${styles.Phase} ${stage !== Stage.DrawCircle ? styles.Disabled : ''}`}>
                    <p>2. 円を描画するか、半径を入力してください.</p>
                    <Form.Group>
                        <Form.Label>半径km</Form.Label>
                        <Form.Control type='number'
                            disabled={stage !== Stage.DrawCircle}
                            value={radius} onChange={onInputRadius} />
                    </Form.Group>
                    <Button variant="secondary"
                        onClick={()=>setStage(Stage.SelectCenter)}>戻る</Button>
                </div>
            </div>
        </PromptMessageBox>
    );
}