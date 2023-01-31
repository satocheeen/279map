import { FeatureType } from "279map-common";
import { Feature, Map } from "ol";
import { Draw } from "ol/interaction";
import { DrawEvent } from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTopographyStyle from "../../useTopographyStyle";
import PromptMessageBox from "../PromptMessageBox";

type Props = {
    map: Map;
    geometryType: string;
    drawFeatureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    onCancel?: () => void;
    onOk?: (feature: Feature) => void;
}
const drawingSource = new VectorSource();

enum Stage {
    Drawing,
    Confirm,
}

export function DrawFreeArea(props: Props) {
    const [stage, setStage] = useState(Stage.Drawing);
    const draw = useRef<Draw>();

    const styleHook = useTopographyStyle({
        defaultFeatureType: props.drawFeatureType,
        drawing: true,
    });

    /**
     * 初期化
     */
     useEffect(() => {
        const styleFunction = styleHook.getStyleFunction();
        const drawingLayer = new VectorLayer({
            source: drawingSource,
            style: styleFunction,
            zIndex: 10,
        });
        props.map.addLayer(drawingLayer);

        // Drawインタラクション用意
        const newDraw =new Draw({
            source: drawingSource,
            type: props.geometryType,
            style: styleFunction,
            clickTolerance: 12,
        });
        props.map.addInteraction(newDraw);
        newDraw.on('drawend', (event: DrawEvent) => {
            newDraw.on('drawstart', (event: DrawEvent) => {
                // 円描画でダブルクリックすると、再び描画が始まってしまうので、ここでキャンセル
                newDraw.abortDrawing();
            })
            setStage(Stage.Confirm);
        });

        draw.current = newDraw;

        return () => {
            props.map.removeInteraction(newDraw);
            drawingSource.clear();
            props.map.removeLayer(drawingLayer);
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

    const onDrawingCanceled = useCallback(() => {
        // 書きかけ削除
        drawingSource.clear();
        // DrawインタラクションOff
        if (draw.current) {
            props.map.removeInteraction(draw.current);
        }
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props]);

    const clickMsg = useMemo(() => {
        return props.geometryType === 'Polygon'
                ? 'ダブルクリック'
                : 'クリック';
    }, [props.geometryType]);

    const onOk = useCallback(() => {
        if (!props.onOk)
            return;
        
        const feature = drawingSource.getFeatures()[0];
        if (!feature) {
            console.warn('no feature');
            return;
        }
        props.onOk(feature);
    }, [props]);

    const onConfirmCancel = useCallback(() => {
        // 書きかけ削除
        drawingSource.clear();
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