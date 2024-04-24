import { Draw } from "ol/interaction";
import { DrawEvent } from "ol/interaction/Draw";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTopographyStyle from "../../useTopographyStyle";
import PromptMessageBox from "../PromptMessageBox";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { useMap } from "../../useMap";
import { FeatureType } from "../../../../types-common/common-types";
import { LayerType } from "../../../TsunaguMap/VectorLayerMap";

type Props = {
    geometryType: string;
    drawFeatureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    onCancel?: () => void;
    onOk?: (feature: Feature<Geometry>) => void;
}
enum Stage {
    Drawing,
    Confirm,
}

export function DrawFreeArea(props: Props) {
    const { map } = useMap();
    const [stage, setStage] = useState(Stage.Drawing);
    const draw = useRef<Draw>();

    const styleHook = useTopographyStyle({
        defaultFeatureType: props.drawFeatureType,
        drawing: true,
    });
    const drawingSource = useRef<VectorSource|null>(null);

    /**
     * 初期化
     */
     useEffect(() => {
        if (!map) return;
        const styleFunction = styleHook.getStyleFunction();
        const drawingLayer = map.createDrawingLayer(LayerType.Topography, styleHook.getStyleFunction());
        drawingSource.current = drawingLayer.getSource();

        // Drawインタラクション用意
        const newDraw =new Draw({
            source: drawingSource.current as VectorSource,
            type: props.geometryType,
            style: styleFunction,
            clickTolerance: 12,
        });
        map.addInteraction(newDraw);
        newDraw.on('drawend', (event: DrawEvent) => {
            if (props.geometryType === 'Circle') {
                newDraw.once('drawstart', (event: DrawEvent) => {
                    // 円描画でダブルクリックすると、再び描画が始まってしまうので、ここでキャンセル
                    newDraw.abortDrawing();
                })
            }
            setStage(Stage.Confirm);
        });

        draw.current = newDraw;

        return () => {
            map.removeInteraction(newDraw);
            map.removeDrawingLayer(drawingLayer);
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map]);

    const onDrawingCanceled = useCallback(() => {
        // DrawインタラクションOff
        if (draw.current) {
            map?.removeInteraction(draw.current);
        }
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props, map]);

    const clickMsg = useMemo(() => {
        return props.geometryType === 'Polygon'
                ? 'ダブルクリック'
                : 'クリック';
    }, [props.geometryType]);

    const onOk = useCallback(() => {
        if (!props.onOk)
            return;
        
        const feature = drawingSource.current?.getFeatures()[0];
        if (!feature) return;

        props.onOk(feature);
    }, [props]);

    const onConfirmCancel = useCallback(() => {
        // 書きかけ削除
        drawingSource.current?.clear();
        setStage(Stage.Drawing);
    }, []);

    switch(stage) {
        case Stage.Drawing:
            return (
                <PromptMessageBox message={'地図上で作図してください\n（完了ボタンまたは' + clickMsg + 'で完了）'}
                    okname="完了"
                    ok={draw.current?.finishDrawing}
                    cancel={onDrawingCanceled}
                />
            );
        case Stage.Confirm:
            return (
                <PromptMessageBox message='これでよろしいですか'
                    cancelname='戻る'
                    ok={onOk}
                    cancel={onConfirmCancel} />
            )
    }

}