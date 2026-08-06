import { FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style } from "ol/style";
import { useCallback } from "react";
import { colorWithAlpha } from '../../util/CommonUtility';
import { MapStyles } from "../../util/constant-defines";
import { currentMapKindAtom } from "../../store/session";
import { useAtomCallback } from "jotai/utils";
import { MapKind, FeatureType } from "../../types-common/common-types";

const DRAWING_COLOR = '#eebbaa'

export class RoadWidth {
    static S = new RoadWidth('S', 0.000005, '小道');
    static M = new RoadWidth('M', 0.00002, '一般道');
    static L = new RoadWidth('L', 0.00005, '大通り');

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
    defaultFeatureType?: FeatureType;   // featureのpropertiesにfeatureType未指定の場合に設定するFeatureType
    drawing?: boolean;  // trueの場合、描画中用のスタイルを生成する
}
/**
 * 地形スタイルを生成するためのクラス
 * @param props 
 */
export default function useTopographyStyle(props: Props) {
    const getStyleFunction = useAtomCallback(
        useCallback((get, set, forceStyleFunc?: (feature: FeatureLike, resolution: number, defaultStyle: Style) => Style) => {
            const mapKind = get(currentMapKindAtom);
            return (feature: FeatureLike, resolution: number) => {
                let featureType: FeatureType = feature.getProperties()['featureType'];
                if (featureType === undefined && props.defaultFeatureType) {
                    featureType = props.defaultFeatureType;
                }
                if (featureType === undefined) {
                    featureType = mapKind === MapKind.Virtual ? FeatureType.EARTH : FeatureType.AREA;
                    console.warn('FeatureType undefined', feature.getId(), feature.getGeometry()?.getType(), 'set', featureType);
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
                        const properties = feature.getProperties();
                        defaultColor = 'color' in properties ? properties.color : MapStyles.Area.color;
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
                        color: colorWithAlpha(defaultColor, defaultColor === 'transparent' ? 0 : alpha),
                    }),
                    zIndex,
                });
                if (!forceStyleFunc) {
                    return defaultStyle;
                }
                return forceStyleFunc(feature, resolution, defaultStyle);
            };
        }, [props.defaultFeatureType, props.drawing])
    )

    return {
        getStyleFunction,
    }
}