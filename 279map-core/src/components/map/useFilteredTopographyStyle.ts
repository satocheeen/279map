import { useCallback, useContext, useEffect } from 'react';
import useFilterStatus from "./useFilterStatus";
import useTopographyStyle from "./useTopographyStyle";
import { FeatureType } from '../../279map-common';
import { FeatureLike } from 'ol/Feature';
import { colorWithAlpha } from '../../util/CommonUtility';
import { Style } from 'ol/style';
import { MapChartContext } from '../TsunaguMap/MapChart';

/**
 * フィルタを加味して地形Featureのスタイルを設定するフック
 */
export default function useFilteredTopographyStyle() {
    const { map } = useContext(MapChartContext);
    const { getForceColor, getFilterStatus } = useFilterStatus();

    const topographyStyleHook = useTopographyStyle({
    });

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
        map.setTopographyLayerStyle(topographyStyleFunction);
    }, [map, topographyStyleFunction]);

}