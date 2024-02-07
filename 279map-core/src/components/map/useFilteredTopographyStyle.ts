import { useCallback, useContext } from 'react';
import useFilterStatus from "./useFilterStatus";
import useTopographyStyle from "./useTopographyStyle";
import { FeatureLike } from 'ol/Feature';
import { colorWithAlpha } from '../../util/CommonUtility';
import { Style } from 'ol/style';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { FeatureType } from '../../types-common/common-types';
import ol_color from 'ol/color';

/**
 * フィルタを加味して地形Featureのスタイルを設定するフック
 */
export default function useFilteredTopographyStyle() {
    const { getForceColor, getFilterStatus, getOpacity } = useFilterStatus();
    const { getStyleFunction } = useTopographyStyle({
    });
    const { filter } = useContext(OwnerContext);

    const topographyStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const color = getForceColor(feature);
        const filterStatus = getFilterStatus(feature);
        const opacity = getOpacity(feature);
        const func = getStyleFunction((feature, resolution, defaultStyle) => {
            if (!color && opacity === 1 && filterStatus === 'Normal') {
                return defaultStyle;
            }
            const featureType = feature.getProperties()['featureType'];
            if (featureType === FeatureType.AREA) {
                if (filterStatus === 'UnFiltered') {
                    if (filter?.unmatchView === 'hidden') {
                        return new Style();
                    }
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
                    if (opacity === 1) {
                        // 選択中の場合
                        defaultStyle.getStroke().setWidth(3);
                    }
                }
            }
            // set opacity
            if (opacity !== 1) {
                const currentColor = defaultStyle.getFill().getColor() as ol_color.Color;
                defaultStyle.getFill().setColor(colorWithAlpha(color ?? currentColor, opacity))
            }

            return defaultStyle;
        });
        const style = func(feature, resolution);
        // TODO: 島名表示
        return style;

    }, [getStyleFunction, getFilterStatus, getForceColor, filter, getOpacity]);

    return {
        topographyStyleFunction,
    }

}