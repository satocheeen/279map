import { Fill, Stroke, Style } from "ol/style";
import { colorWithAlpha } from "../../../util/CommonUtility";
import { MapStyles } from "../../../util/constant-defines";
import { FeatureLike } from "ol/Feature";
import { FeatureType } from "../../../types-common/common-types";

export function topographySelectStyleFunction(feature: FeatureLike, resolution: number, defaultStyle: Style) {
    const featureType = feature.getProperties()['featureType'];
    let strokeColor;
    let fillColor = '';
    let alpha: number;
    let zIndex: number;
    switch(featureType) {
        case FeatureType.FOREST:
            strokeColor = MapStyles.Forest.selectedColor.stroke;
            fillColor = MapStyles.Forest.selectedColor.fill;
            alpha = MapStyles.Forest.selectedColor.alpha;
            zIndex = MapStyles.Forest.zIndex;
            break;
        case FeatureType.AREA:
            strokeColor = MapStyles.Area.selectedColor.stroke;
            fillColor = MapStyles.Area.selectedColor.fill;
            alpha = MapStyles.Area.selectedColor.alpha;
            zIndex = MapStyles.Area.zIndex;
            break;
        case FeatureType.ROAD:
            strokeColor = MapStyles.Road.selectedColor.stroke;
            fillColor = MapStyles.Road.selectedColor.fill;
            alpha = MapStyles.Road.selectedColor.alpha;
            zIndex = MapStyles.Road.zIndex;
            break;
        default:
            strokeColor = MapStyles.Earth.selectedColor.stroke;
            fillColor = MapStyles.Earth.selectedColor.fill;
            alpha = MapStyles.Earth.selectedColor.alpha;
            zIndex = MapStyles.Earth.zIndex;
        }
    return new Style({
        stroke: new Stroke({
            color: strokeColor,
            width: 3,
        }),
        fill: new Fill({
            color: colorWithAlpha(fillColor, alpha),
        }),
        zIndex,
    });
}