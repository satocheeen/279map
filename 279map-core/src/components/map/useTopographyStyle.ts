import { FeatureType } from "../../279map-common";
import { FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style } from "ol/style";
import { useCallback } from "react";
import { colorWithAlpha } from '../../util/CommonUtility';
import { MapStyles } from "../../util/constant-defines";

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
            let featureType: FeatureType = feature.getProperties()['featureType'];
            if (featureType === undefined && props.defaultFeatureType) {
                featureType = props.defaultFeatureType;
            }
            if (featureType === undefined) {
                console.warn('FeatureType undefined');
                featureType = FeatureType.EARTH;
            }
            let defaultColor;
            let zIndex;
            let alpha = 1;
            switch(featureType) {
                case FeatureType.EARTH:
                    defaultColor = MapStyles.Earth.color;
                    zIndex = MapStyles.Earth.zIndex;
                    break;
                case FeatureType.FOREST:
                    defaultColor = MapStyles.Forest.color;
                    zIndex = MapStyles.Forest.zIndex;
                    break;
                case FeatureType.ROAD:
                    defaultColor = MapStyles.Road.color;
                    zIndex = MapStyles.Road.zIndex;
                    break;
                case FeatureType.AREA:
                    defaultColor = MapStyles.Area.color;
                    zIndex = MapStyles.Area.zIndex;
                    alpha = 0.3;
                    break;
                default:
                    defaultColor = MapStyles.Earth.color;
                    zIndex = MapStyles.Earth.zIndex;
                    break;
            }

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