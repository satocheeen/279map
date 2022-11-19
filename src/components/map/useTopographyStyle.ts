import { FeatureType } from "279map-common/dist/types";
import { FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style } from "ol/style";
import { useCallback } from "react";
import { colorWithAlpha } from '../../util/CommonUtility';

const EARTH_COLOR = '#f5f2e9';
const FOREST_COLOR = '#B6EB7A';
const ROAD_COLOR = '#b1a560';
const AREA_COLOR = '#aaa';
const DRAWING_COLOR = '#eebbaa'

export class RoadWidth {
    static S = new RoadWidth('S', 0.005, '小道');
    static M = new RoadWidth('M', 0.02, '一般道');
    static L = new RoadWidth('L', 0.05, '大通り');

    key: string;
    distance: number;
    name: string;

    constructor(key: string, width: number, name: string) {
        this.key = key;
        this.distance = width;
        this.name = name;
    }

    static values(): RoadWidth[] {
        return Object.values(this);
    }

    static getValueOfKey(key: string): RoadWidth {
        return Object.values(this).find(item => item.key === key);
    }
}

type Props = {
    defaultFeatureType?: FeatureType;
    drawing?: boolean;  // 描画中用のスタイルか
}
/**
 * 地形スタイルを生成するためのクラス
 * @param props 
 */
export default function useTopographyStyle(props: Props) {
    const getStyleFunction = useCallback((forceStyleFunc?: (feature: FeatureLike, resolution: number, defaultStyle: Style) => Style) => {
        return (feature: FeatureLike, resolution: number) => {
            let featureType = feature.getProperties()['featureType'];
            if (featureType === undefined) {
                featureType = props.defaultFeatureType;
            }
            let defaultColor;
            let zIndex;
            let alpha = 1;
            switch(featureType) {
                case FeatureType.EARTH:
                    defaultColor = EARTH_COLOR;
                    zIndex = 1;
                    break;
                case FeatureType.FOREST:
                    defaultColor = FOREST_COLOR;
                    zIndex = 2;
                    break;
                case FeatureType.ROAD:
                    defaultColor = ROAD_COLOR;
                    zIndex = 3;
                    break;
                case FeatureType.AREA:
                    defaultColor = AREA_COLOR;
                    zIndex = 1;
                    alpha = 0.3;
                    break;
                default:
                    defaultColor = EARTH_COLOR;
                    zIndex = 1;
                    break;
            }
            // if (props.drawing) {
            //     defaultColor = DRAWING_COLOR;
            // }

            const defaultStyle = new Style({
                stroke: new Stroke({
                    color: props.drawing ? DRAWING_COLOR : defaultColor,
                    width: props.drawing ? 3 : 1,
                }),
                fill: new Fill({
                    color: colorWithAlpha(defaultColor, alpha),
                }),
                zIndex,
            });
            if (!forceStyleFunc) {
                return defaultStyle;
            }
            return forceStyleFunc(feature, resolution, defaultStyle);
        };
    }, [props.defaultFeatureType, props.drawing]);

    return {
        getStyleFunction,
    }
}