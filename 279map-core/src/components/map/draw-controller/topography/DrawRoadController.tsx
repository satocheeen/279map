import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Feature } from 'ol';
import OlFeature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import RoadWidthSelecter from './RoadWidthSelecter';
import { extractGeoProperty, GeoPropertiesForCore } from '../../../../util/MapUtility';
import { useMap } from '../../useMap';
import { FeatureType, GeoProperties } from '../../../../types-common/common-types';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { ItemGeoInfo } from '../../../../entry';

enum Stage {
    DRAWING,        // 描画
    SELECT_WIDTH,   // 道幅選択
}
type Props = {
    /** 親からもらうprops定義 */
    dataSourceId: string;
    onCancel: () => void;
    onCommit: (item: ItemGeoInfo) => void;
}

/**
 * 道描画コントローラ
 */
export default function DrawRoadController(props: Props) {
    const { map } = useMap();
    const [stage, setStage] = useState(Stage.DRAWING);

    const draw = useRef<Draw|undefined>();
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.ROAD,
    });
    // 描画中のFeature
    const drawingFeature = useRef<OlFeature | undefined>();
    const drawingSource = useRef<VectorSource|null>(null);

    /**
     * 初期化
     */
    useEffect(() => {
        if (!map) return;
        const drawingLayer = map.createDrawingLayer(LayerType.Topography, styleHook.getStyleFunction());
        drawingSource.current = drawingLayer.getSource();

        // Drawインタラクション用意
        const newDraw =new Draw({
            source: drawingSource.current as VectorSource,
            type: 'MultiLineString',
            style: styleHook.getStyleFunction(),
            clickTolerance: 12,
        });
        map.addInteraction(newDraw);
        newDraw.on('drawend', (event: DrawEvent) => {
            // 作図完了
            map.removeInteraction(newDraw);

            drawingFeature.current = event.feature;
            setStage(Stage.SELECT_WIDTH);
        });
        draw.current = newDraw;

        return () => {
            if (draw.current) {
                map.removeInteraction(draw.current);
            }
            map.removeDrawingLayer(drawingLayer);
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map]);

    // 描画中にキャンセルボタンが押された場合
    const onCanceled = useCallback(() => {
        // 描画とりやめ
        props.onCancel();
    }, [props]);    

    const registFeatureFunc = useCallback(async() => {
        if (!drawingFeature.current) {
            console.warn('描画図形なし（想定外）');
            return;
        }
        
        // line情報を保存する
        const currentPropeties = drawingFeature.current.getProperties() as GeoPropertiesForCore;
        const geoJson = currentPropeties.featureType === FeatureType.ROAD ? currentPropeties.lineJson : undefined;
        const geoProperties = extractGeoProperty(currentPropeties);
        if (!geoJson) {
            console.warn('ライン情報なし');
            return;
        }

        props.onCommit({
            geometry: geoJson.geometry,
            geoProperties,
        });

    }, [props]);

    const onWidthSelected = useCallback(async(feature: Feature) => {
        drawingFeature.current = feature;
        drawingSource.current?.addFeature(feature);
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
                <RoadWidthSelecter targetRoad={drawingFeature.current} onOk={onWidthSelected} onCancel={onCanceled} />
            );
    }

}
