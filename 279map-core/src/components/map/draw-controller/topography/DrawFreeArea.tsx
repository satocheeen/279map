import { FeatureType } from "../../../../279map-common";
import { Draw } from "ol/interaction";
import { DrawEvent } from "ol/interaction/Draw";
import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";
import useTopographyStyle from "../../useTopographyStyle";
import PromptMessageBox from "../PromptMessageBox";
import { MapChartContext } from "../../../TsunaguMap/MapChart";

type Props = {
    geometryType: string;
    drawFeatureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    onCancel?: () => void;
    onOk?: () => void;
}
enum Stage {
    Drawing,
    Confirm,
}

export function DrawFreeArea(props: Props) {
    const { map } = useContext(MapChartContext);
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
        const source = map.getDrawingLayer().getSource();
        if (!source) {
            console.warn('想定外 drawing source undefined');
            return;
        }

        // Drawインタラクション用意
        const newDraw =new Draw({
            source,
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
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

    const onDrawingCanceled = useCallback(() => {
        // DrawインタラクションOff
        if (draw.current) {
            map.removeInteraction(draw.current);
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
        
        props.onOk();
    }, [props]);

    const onConfirmCancel = useCallback(() => {
        // 書きかけ削除
        map.getDrawingLayer().getSource()?.clear();
        setStage(Stage.Drawing);
    }, [map]);

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