import { FeatureType, GeocoderIdInfo, IconKey } from "../graphql/__generated__/types"
import { Feature } from 'geojson';

export type GeoProperties = {
    type: 'StructurePropeties';
    featureType: FeatureType.Structure;
    icon: IconKey;
} | {
    type: 'RoadProperties',
    featureType: FeatureType.Road;
    /* 元のline */
    lineJson: Feature;
    /* RoadWidth.key */
    width: string;
} | {
    /* 円の場合のプロパティ */
    type: 'CircleProperties',
    featureType: FeatureType.Earth | FeatureType.Forest | FeatureType.Area;
    /* 半径 */
    radius: number;
} | {
    type: 'GeocoderFeatureProperties',
    /* OSM等で管理されているFeatureの場合のプロパティ */
    featureType: FeatureType.Area;
    geocoderIdInfo: GeocoderIdInfo;
} | {
    type: 'TrackPropeties';
    featureType: FeatureType.Track;
    minZoom: number;
    maxZoom: number;
}
