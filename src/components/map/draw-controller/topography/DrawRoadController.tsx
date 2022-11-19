import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Feature, Map } from 'ol';
import OlFeature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import RoadWidthSelecter from './RoadWidthSelecter';
import { extractGeoProperty } from '../../../../util/MapUtility';
import { useSpinner } from '../../../common/spinner/useSpinner';
import { useAppDispatch } from '../../../../store/configureStore';
import { registFeature } from '../../../../store/data/dataThunk';
import { FeatureType, GeoProperties } from '279map-common/dist/types';

enum Stage {
    DRAWING,        // 描画
    SELECT_WIDTH,   // 道幅選択
}
type Props = {
    /** 親からもらうprops定義 */
    map: Map;
    close: () => void;  // 作図完了時のコールバック
}

const drawingSource = new VectorSource();

/**
 * 道描画コントローラ
 */
export default function DrawRoadController(props: Props) {
    const [stage, setStage] = useState(Stage.DRAWING);

    const draw = useRef<Draw|undefined>();
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.ROAD,
    });
    // 描画中のFeature
    const drawingFeature = useRef<OlFeature | undefined>();
    const spinnerHook = useSpinner();
    const dispatch = useAppDispatch();

    /**
     * 初期化
     */
    useEffect(() => {
        const drawingLayer = new VectorLayer({
            source: drawingSource,
            style: styleHook.getStyleFunction(),
            zIndex: 10,
        });
        props.map.addLayer(drawingLayer);

        // Drawインタラクション用意
        const newDraw =new Draw({
            source: drawingSource,
            type: 'MultiLineString',
            style: styleHook.getStyleFunction(),
            clickTolerance: 12,
        });
        props.map.addInteraction(newDraw);
        newDraw.on('drawend', (event: DrawEvent) => {
            // 作図完了
            props.map.removeInteraction(newDraw);

            drawingFeature.current = event.feature;
            setStage(Stage.SELECT_WIDTH);
        });
        draw.current = newDraw;

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

    // 描画中にキャンセルボタンが押された場合
    const onCanceled = useCallback(() => {
        // 描画とりやめ
        props.close();
    }, [props]);
    

    const registFeatureFunc = useCallback(async() => {
        if (!drawingFeature.current) {
            console.warn('描画図形なし（想定外）');
            return;
        }
        
        // line情報を保存する
        const geoProperties = extractGeoProperty(drawingFeature.current.getProperties());
        const geoJson = geoProperties.featureType === FeatureType.ROAD ? geoProperties.lineJson : undefined;
        if (!geoJson) {
            console.warn('ライン情報なし');
            return;
        }

        // DB登録
        spinnerHook.showSpinner('登録中...');
        console.log('geoJson', geoJson);
        await dispatch(registFeature({
            geometry: geoJson.geometry,
            geoProperties: geoJson.properties as GeoProperties,
        }));
        spinnerHook.hideSpinner();

        props.close();
    }, [props, spinnerHook, dispatch]);

    const onWidthSelected = useCallback(async(feature: Feature) => {
        drawingFeature.current = feature;
        drawingSource.addFeature(feature);
        registFeatureFunc();
    }, [registFeatureFunc]);

    switch(stage) {
        case Stage.DRAWING:
            return (
                <PromptMessageBox 
                    message={'地図上で作図してください\n（完了ボタンまたはダブルクリックで完了）'} 
                    okname="完了" ok={()=>{draw.current?.finishDrawing()}} cancel={onCanceled} />
            );
        case Stage.SELECT_WIDTH:
            if (drawingFeature.current === undefined) {
                console.warn('not set drawingFeature');
                return null;
            }
            return (
                <RoadWidthSelecter map={props.map} targetRoad={drawingFeature.current} onOk={onWidthSelected} onCancel={onCanceled} />
            );
    }

}
