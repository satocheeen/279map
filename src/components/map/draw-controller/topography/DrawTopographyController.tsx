import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Map } from 'ol';
import Feature from 'ol/Feature';
import * as MapUtility from '../../../../util/MapUtility';
import PromptMessageBox from '../PromptMessageBox';
import { useSpinner } from '../../../common/spinner/useSpinner';
import SelectDrawFeature, { DrawFeatureType } from './SelectDrawFeature';
import DrawPointRadius from './DrawPointRadius';
import { DrawAreaAddress } from './DrawAreaAddress';
import { DrawFreeArea } from './DrawFreeArea';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import useTopographyStyle from '../../useTopographyStyle';
import { useAppDispatch } from '../../../../store/configureStore';
import { registFeature } from '../../../../store/data/dataThunk';
import { FeatureType, GeoProperties } from '279map-common/dist/types';

type Props = {
    map: Map;   // コントロール対象の地図
    drawFeatureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    close: () => void;  // 作図完了時のコールバック
}

// 描画状況
enum Stage {
    SELECTING_FEATURE,

    // 多角形 or 円描画
    FREE_DRAWING,

    // 住所検索
    SEARCH_AREA_ADDRESS, 
    SEARCH_POINT_ADDRESS, 
}

// 一度きりの生成でいいもの
const drawingSource = new VectorSource();
const drawingLayer = new VectorLayer({
    source: drawingSource,
    zIndex: 10,
});

/**
 * 島、緑地の作図コントローラ
 */
export default function DrawTopographyController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);

    const [geometryType, setGeometryType] = useState('Polygon');
    const drawingFeature = useRef<Feature | undefined>(undefined);  // 描画中のFeature

    const dispatch = useAppDispatch();
    const spinner = useSpinner();
    const styleHook = useTopographyStyle({
        defaultFeatureType: props.drawFeatureType,
        drawing: true,
    });

    // 初期状態
    useEffect(() => {
        props.map.addLayer(drawingLayer);
        drawingLayer.setStyle(styleHook.getStyleFunction());

        return () => {
            // UnMount時
            drawingSource.clear();
            props.map.removeLayer(drawingLayer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const registFeatureFunc = useCallback(async() => {
        if (!drawingFeature.current) {
            console.warn('描画図形なし（想定外）');
            return;
        }
        spinner.showSpinner('登録中...');

        // DB登録
        const geoJson = MapUtility.createGeoJson(drawingFeature.current);

        await dispatch(registFeature({
            geometry: geoJson.geometry,
            geoProperties: Object.assign({}, geoJson.properties, {
                featureType: props.drawFeatureType,
            } as GeoProperties),
        }));

        spinner.hideSpinner();
        props.close();
    }, [spinner, props, dispatch]);

    const onDrawEnd = useCallback(async (feature: Feature) => {
        drawingFeature.current = feature;
        drawingSource.addFeature(feature);
        registFeatureFunc();
    }, [registFeatureFunc]);

    // 描画図形選択後
    const onSelectDrawFeatureType = useCallback((selected: DrawFeatureType) => {
        switch(selected) {
            case DrawFeatureType.FreePolygon:
                setGeometryType('Polygon');
                setStage(Stage.FREE_DRAWING);
                break;
            case DrawFeatureType.FreeCircle:
                setGeometryType('Circle');
                setStage(Stage.FREE_DRAWING);
                break;
            case DrawFeatureType.AddressArea:
                setStage(Stage.SEARCH_AREA_ADDRESS);
                break;
            case DrawFeatureType.AddressPointRadius:
                setStage(Stage.SEARCH_POINT_ADDRESS);
                break;
        }
    }, []);
    

    const onSelectFeatureCanceled = () => {
        props.close();
    }

    const onDrawCanceled = useCallback(() => {
        setStage(Stage.SELECTING_FEATURE);
    }, []);

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <PromptMessageBox message='作図方法を選んでください.'
                    cancel={onSelectFeatureCanceled}>
                    <SelectDrawFeature onSelect={onSelectDrawFeatureType} />
                </PromptMessageBox>
            );
        case Stage.FREE_DRAWING:
            return (
                <DrawFreeArea map={props.map}
                    geometryType={geometryType}
                    drawFeatureType={props.drawFeatureType}
                    onOk={(feature) => onDrawEnd(feature)}
                    onCancel={onDrawCanceled}
                />
            );
        case Stage.SEARCH_AREA_ADDRESS:
            return (
                <DrawAreaAddress map={props.map} 
                    onOk={(feature) => onDrawEnd(feature)}
                    onCancel={onDrawCanceled}/>
        );
        case Stage.SEARCH_POINT_ADDRESS:
            return(
                <DrawPointRadius map={props.map}
                    onOk={(feature) => onDrawEnd(feature)}
                    onCancel={onDrawCanceled}/>
            );            
    }
}
