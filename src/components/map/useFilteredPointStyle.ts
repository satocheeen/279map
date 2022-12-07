import { FeatureLike } from 'ol/Feature';
import { useCallback, useContext, useEffect } from 'react';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import usePointStyle from "./usePointStyle";
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import useFilterStatus from './useFilterStatus';
import { Fill, Style, Text } from 'ol/style';

// 建物ラベルを表示するresolution境界値（これ以下の値の時に表示）
const StructureLabelResolution = 0.003;

type Props = {
    structureLayer: VectorLayer<VectorSource>; // 建物レイヤ
}

/**
 * フィルタを加味した、建物や地点のスタイルを生成するためのフック
 * @param props 
 */
export default function useFilteredPointStyle(props: Props) {
    const { getForceColor, getFilterStatus } = useFilterStatus();

    const pointStyleHook = usePointStyle({
        structureLayer: props.structureLayer, 
    });

    const colorFunc = useCallback((feature: FeatureLike): {color?: string; alpha?: number} => {
        const color = getForceColor(feature);
        const filterStatus = getFilterStatus(feature);
        const alpha = filterStatus.status === 'UnFiltered' ? 0.3 : 1;

        return {
            color,
            alpha,
        };
    }, [getForceColor, getFilterStatus]);

    const ownerContext = useContext(OwnerContext);

    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const func = pointStyleHook.getStructureStyleFunction(colorFunc);
        const style = func(feature, resolution);
        if (!ownerContext.disabledLabel && resolution <= StructureLabelResolution) {
            // ラベル設定
            const text = createLabel(feature);
            style.setText(text);
        }
        return style;

    }, [pointStyleHook, colorFunc, ownerContext.disabledLabel]);

    useEffect(() => {
        props.structureLayer.setStyle(pointStyleFunction);
    }, [pointStyleFunction]);
}

/**
 * 建物名ラベルを生成して返す
 * @param feature 
 */
 function createLabel(feature: FeatureLike): Text {
    // ラベル設定
    let name = feature.getProperties().name;
    if (name === undefined) {
        name = '';
    }

    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        text: name,
        overflow: true,
        backgroundFill: new Fill({ color: '#ffffffaa' }),
        font: '1rem Calibri,sans-serif',
    });

    return text;
}
