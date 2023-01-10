import { FeatureLike } from 'ol/Feature';
import { useCallback, useContext, useEffect } from 'react';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import usePointStyle from "./usePointStyle";
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import useFilterStatus from './useFilterStatus';
import { Fill, Style, Text } from 'ol/style';
import { useFilter } from '../../store/useFilter';

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
    const { filteredItemIdList } = useFilter();

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
        const features = feature.get('features') as FeatureLike[];
        // console.log('pointStyleFunction', features);
        let size = features.length;

        // 複数アイテムがまとまっており、
        // フィルタがかかっている場合は、フィルタ条件に該当するものをアイコン表示
        let mainFeature = features[0];
        if (filteredItemIdList && size > 1) {
            const filteredFeature = features.filter(feature => filteredItemIdList.includes(feature.getId() as string));
            if (filteredFeature.length > 0) {
                mainFeature = filteredFeature[0];
            }
            size = filteredFeature.length;
        }

        const func = pointStyleHook.getStructureStyleFunction(colorFunc);
        const style = func(mainFeature, resolution);
        if (size > 1) {
            // 複数アイテムがまとまっている場合、まとまっている数を表示
            setClusterLabel(style, size);

        } else if (!ownerContext.disabledLabel && resolution <= StructureLabelResolution) {
            // ラベル設定
            const text = createItemNameLabel(features[0]);
            style.setText(text);
        }
        return style;

    }, [filteredItemIdList, pointStyleHook, colorFunc, ownerContext.disabledLabel]);

    useEffect(() => {
        props.structureLayer.setStyle(pointStyleFunction);
    }, [pointStyleFunction, props.structureLayer]);
}

/**
 * 建物名ラベルを生成して返す
 * @param feature 
 */
function createItemNameLabel(feature: FeatureLike): Text {
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

function setClusterLabel(style: Style, size: number) {
    const imageSize = style.getImage().getImageSize();
    const scale = style.getImage().getScale() as number;
    const offsetY = imageSize ? - (imageSize[1] / 1.6 * scale) : 0;
    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        offsetY,
        text: size + '',
        overflow: true,
        backgroundFill: new Fill({ color: '#ffffffff' }),
        font: '1rem Calibri,sans-serif',
        padding: [0, 5, 0, 5],
        scale: 1.2,
    });
    style.setText(text);
}