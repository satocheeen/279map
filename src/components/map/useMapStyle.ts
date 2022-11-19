import { FeatureLike } from 'ol/Feature';
import { useCallback, useEffect, useRef } from 'react';
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import usePointStyle from './usePointStyle';
import useTopographyStyle from './useTopographyStyle';
import { useFilter } from '../../store/useFilter';
import { colorWithAlpha } from '../../util/CommonUtility';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { FeatureType } from '279map-common/dist/types';

// 建物ラベルを表示するresolution境界値（これ以下の値の時に表示）
const StructureLabelResolution = 0.003;

const FORCE_COLOR = '#8888ff';

/**
 * 地図上の地物のスタイルを取り扱う。
 * フィルタ条件などを加味して、スタイルを決定する。
 * @returns 
 */
export default function useMapStyle() {
    const pointsLayer = useRef<VectorLayer<VectorSource>|null>(null);
    const topographyLayer = useRef<VectorLayer<VectorSource>|null>(null);
    const trackLayer = useRef<VectorLayer<VectorSource>|null>(null);
    const pointStyleHook = usePointStyle({
        structureLayer: pointsLayer.current as VectorLayer<VectorSource>, 
    });
    const topographyStyleHook = useTopographyStyle({
    });
    const filterHook = useFilter();
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);

    /**
     * 指定の地物のフィルタ状態を返す
     */
     const getFilterStatus = useCallback((feature: FeatureLike) => {
        return filterHook?.getFilterStatus(feature.getId() as string);
    }, [filterHook]);

    /**
     * 指定の地物の強調表示色を返す
     * @return 強調表示色。強調しない場合は、undefined。
     */
    const getForceColor = useCallback((feature: FeatureLike): string | undefined => {
        if (selectedItemIds.includes(feature.getId() as string)) {
            return FORCE_COLOR;
        }

        const filterStatus = getFilterStatus(feature);
        if (filterStatus.status !== 'Filtered') {
            return;
        }
    
        // カテゴリフィルタにヒットした場合、フィルタしたカテゴリの色で表示する
        return FORCE_COLOR;
        // if (filterStatus.filter.type === 'category') {
        //     const categoryDef = categoryMap.get(filterStatus.filter.categoryName);
        //     return categoryDef?.color;
        // } else {
        //     // その他のフィルタに非っとした場合は、強調表示
        //     return FORCE_COLOR;
        // }

    }, [getFilterStatus, selectedItemIds]);

    const colorFunc = useCallback((feature: FeatureLike): {color?: string; alpha?: number} => {
        const color = getForceColor(feature);
        const filterStatus = getFilterStatus(feature);
        const alpha = filterStatus.status === 'UnFiltered' ? 0.3 : 1;

        return {
            color,
            alpha,
        };
    }, [getForceColor, getFilterStatus]);

    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const func = pointStyleHook.getStructureStyleFunction(colorFunc);
        const style = func(feature, resolution);
        if (resolution <= StructureLabelResolution) {
            // ラベル設定
            const text = createLabel(feature);
            style.setText(text);
        }
        return style;

    }, [pointStyleHook, colorFunc]);

    useEffect(() => {
        pointsLayer.current?.setStyle(pointStyleFunction);
    }, [pointStyleFunction]);

    const setPointsLayer = useCallback((layer: VectorLayer<VectorSource>) => {
        pointsLayer.current = layer;
        pointsLayer.current.setStyle(pointStyleFunction);
    }, [pointStyleFunction]);

    const topographyStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const color = getForceColor(feature);
        const filterStatus = getFilterStatus(feature);
        const func = topographyStyleHook.getStyleFunction((feature, resolution, defaultStyle) => {
            if (!color && filterStatus.status === 'Normal') {
                return defaultStyle;
            }
            const featureType = feature.getProperties()['featureType'];
            if (featureType === FeatureType.AREA) {
                if (filterStatus.status === 'UnFiltered') {
                    const defaultStrokeColor = defaultStyle.getStroke().getColor();
                    if (defaultStrokeColor)
                        defaultStyle.getStroke().setColor(colorWithAlpha(defaultStrokeColor.toString(), 0.3));

                    const defaultColor = defaultStyle.getFill().getColor();
                    if (defaultColor)
                        defaultStyle.getFill().setColor(colorWithAlpha(defaultColor.toString(), 0.1));
                } else {
                    if (color) {
                        defaultStyle.getStroke().setColor(color);
                        defaultStyle.getFill().setColor(colorWithAlpha(color, 0.3));
                    }
                }
            } else {
                if (color) {
                    defaultStyle.getStroke().setColor(color);
                    defaultStyle.getStroke().setWidth(3);
                }
            }
            return defaultStyle;
        });
        const style = func(feature, resolution);
        // TODO: 島名表示
        return style;

    }, [topographyStyleHook, getFilterStatus, getForceColor]);

    useEffect(() => {
        topographyLayer.current?.setStyle(topographyStyleFunction);
    }, [topographyStyleFunction]);

    const setTopographyLayer = useCallback((layer: VectorLayer<VectorSource>) => {
        topographyLayer.current = layer;
        topographyLayer.current.setStyle(topographyStyleFunction);
    }, [topographyStyleFunction]);

    const trackStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const type = feature.getGeometry()?.getType();
        const isSelect = (feature.getProperties().select === true);
        let width = 5;

        switch(type) {
            case 'LineString':
            case 'MultiLineString':
            case 'GeometryCollection':
                if (isSelect) {
                    width = 7;
                } else if(feature.getProperties()['type']) {
                    width = 7;
                }
                return new Style({
                    stroke: new Stroke({
                        color: '#f5b461',
                        width,
                    })
                });
            default:
                return new Style();
        }
    }, [])

    useEffect(() => {
        trackLayer.current?.setStyle(trackStyleFunction);
    }, [trackStyleFunction]);

    const setTrackLayer = useCallback((layer: VectorLayer<VectorSource>) => {
        trackLayer.current = layer;
        trackLayer.current.setStyle(trackStyleFunction);
    }, [trackStyleFunction]);

    return {
        setPointsLayer,
        setTopographyLayer,
        setTrackLayer,
    }
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
