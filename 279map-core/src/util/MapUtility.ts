import Feature, { FeatureLike } from 'ol/Feature';
import { Circle, Geometry, LinearRing, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { Extent } from 'ol/extent';
import LineString from 'ol/geom/LineString';
import { RoadWidth } from '../components/map/useTopographyStyle';
import { GeoJsonObject, GeoJsonProperties } from 'geojson';
import { fromExtent } from 'ol/geom/Polygon';
import { getCenter } from 'geolib';
import * as geojson from 'geojson';
import { GeolibInputCoordinates } from 'geolib/es/types';
import proj4 from 'proj4';
import 'https://unpkg.com/jsts@2.6.1/dist/jsts.min.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getCenter as getExtentCenter } from 'ol/extent';
import { Cluster } from 'ol/source';
import { circle, lineString, multiLineString, multiPolygon, polygon, buffer } from '@turf/turf';
import { FeatureType, GeoProperties } from '../graphql/generated/graphql';

/**
 * GeoJSONを元に対応するジオメトリを生成して返す
 * @param position 
 */
 export function createFeatureByGeoJson(geoJson: GeoJsonObject, geoProperties?: GeoProperties): Feature {
    const feature = new GeoJSON().readFeatures(geoJson)[0];
    if (geoProperties?.__typename === 'RoadProperties') {
        const roadWidth = RoadWidth.getValueOfKey(geoProperties.width);
        convertLineToPolygon(feature, roadWidth.distance);
        return feature;

    } else if (geoProperties?.__typename === 'CircleProperties') {
        // 半径指定されている場合は、Circleを生成
        const coordinate = feature.getGeometry()?.getExtent() as Extent;
        const circle = new Feature({
            geometry: new Circle(coordinate, geoProperties.radius),
        });
        return circle;
    } else {
        return feature;
    }
}

/**
 * 建物アイコンのscaleを返す
 * @param resolution 
 * @returns 
 */
export function getStructureScale(resolution: number): number {
    const scale = Math.min(0.001 * (1 / resolution), 1);
    return scale;
}

export function createGeoJson(feature: Feature): GeoJSON.Feature {
    const geoProperties = extractGeoProperty(feature.getProperties());

    if (geoProperties.__typename === 'GeocoderFeatureProperties') {
        // 住所エリアの場合は、Extentとidを登録する
        const extent = feature.getGeometry()?.getExtent();
        if (!extent) {
            throw new Error('no extent');
        }
        const polygon = fromExtent(extent);
        const newFeature = new Feature({
            geometry: polygon,
        });
        newFeature.setProperties(geoProperties);
        const geoJson = JSON.parse(new GeoJSON().writeFeature(newFeature));
        return geoJson;
    }

    const type = feature.getGeometry()?.getType();
    let geoJson;
    if (type === 'Circle') {
        const circle = feature.getGeometry() as Circle;
        const radius = circle.getRadius();
        const coordinates = circle.getCenter();
        geoJson = {
            type: 'Feature',
            properties: Object.assign({}, geoProperties, {
                radius,
            }),
            geometry: {
                type: "Point",
                coordinates: coordinates.slice(0, 2),   // 4点で返ってくるので
            }
        }
    } else {
        geoJson = JSON.parse(new GeoJSON().writeFeature(feature));
        geoJson.properties = geoProperties;
    }
    return geoJson;
}

/**
 * ラインジオメトリをポリゴンに変換する
 * @param lineFeature 変換対象のラインジオメトリ
 * @param distance ポリゴンに変換する際の幅
 */
export function convertLineToPolygon(lineFeature: Feature<Geometry>, distance: number) {
    // 元のJSONを格納しておく(DBへはlineの方を保存する)
    const lineJson = createGeoJson(lineFeature);
    lineFeature.setProperties({
        lineJson,
    });
    try {
        // @ts-ignore
        const ol3Parser = new jsts.io.OL3Parser();
        (ol3Parser as any).inject(Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon);
        const jstsGeom = ol3Parser.read(lineFeature.getGeometry());
        const buffered = jstsGeom.buffer(distance, 2, 2);
        lineFeature.setGeometry(ol3Parser.write(buffered));

    } catch (e) {
        console.warn('jsts error', e);
    }
}

/** 
 * 指定のポリゴンがLineから生成されたものの場合、元のLineを返す
 */
export function getOriginalLine(lineFeature: Feature<Geometry>): Feature<Geometry> {
    const properties = extractGeoProperty(lineFeature.getProperties());
    if (properties.__typename !== 'RoadProperties') {
        console.warn('道ではない');
        return lineFeature;
    }
    const lineJson = properties.lineJson;
    lineJson.properties = {
        featureType: FeatureType.Road,
        width: properties.width,
    };
    console.log('lineJson', lineJson);
    const feature = new GeoJSON().readFeatures(lineJson)[0];

    return feature;
}

/**
 * GeoPropertiesに含まれるプロパティのみを抽出して返す
 * @param properties 
 * @returns 
 */
export function extractGeoProperty(properties: GeoJsonProperties): GeoProperties {
    const prop = properties as GeoProperties;
    switch(prop.__typename){
        case 'StructurePropeties':
            return {
                __typename: prop.__typename,
                featureType: prop.featureType,
                icon: properties?.icon,
            };
        case 'RoadProperties':
            return {
                __typename: prop.__typename,
                featureType: prop.featureType,
                lineJson: properties?.lineJson,
                width: properties?.width,
            };
        case 'CircleProperties':
            return {
                __typename: prop.__typename,
                featureType: prop.featureType,
                radius: prop.radius,
            };
        case 'GeocoderFeatureProperties':
            return {
                __typename: prop.__typename,
                featureType: prop.featureType,
                geocoderIdInfo: prop.geocoderIdInfo,
            }
        case 'TrackPropeties':
            return {
                __typename: prop.__typename,
                featureType: prop.featureType,
                maxZoom: prop?.maxZoom,
                minZoom: prop?.minZoom,
            }
        default:
            return {
                featureType: prop.featureType,
            };
    }
}

export function getLayerName(featureType: FeatureType) {
    switch(featureType) {
        case FeatureType.Structure:
            return 'itemLayer';
        default:
            return 'topographyLayer';
    }
}

/**
 * kmの長さを緯度経度座標での数値に変換する
 * @param p 中心座標
 * @param km km
 * @return 緯度経度座標での値
 */
 export function convertKmToLonLat(p: number[], km: number): number {
    const heimenProjection = "+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
    // 1. 平面座標系に変換
    const pos1 = proj4("EPSG:4326", heimenProjection, p);
    // 2. radius(km)を足す
    pos1[0] += 1000 * km;
    // 3. 緯度経度座標に戻す
    const pos2 = proj4(heimenProjection, "EPSG:4326", pos1);
    // 4. 距離を計測
    const r = Math.sqrt(Math.pow(pos2[0] - p[0], 2) + Math.pow(pos2[1] - p[1], 2));
    return r;
}

export function getGeoJsonCenter(geoJson: GeoJsonObject): false |  { longitude: number; latitude: number; } {
    if (!('coordinates' in geoJson)) {
        console.warn('no coordinates', geoJson);
        return false;
    }
    let coordinates: GeolibInputCoordinates[] | undefined = undefined;
    type GeoJsonPosition = [number, number] | [number, number, number];
    switch(geoJson.type) {
        case 'Point':
            coordinates = [(geoJson as geojson.Point).coordinates as GeoJsonPosition];
            break;
        case 'Polygon':
            coordinates = ((geoJson as geojson.Polygon).coordinates as GeoJsonPosition[][])[0];
            break;
    }
    if (!coordinates) {
        return false;
    }
    try {
        const center = getCenter(coordinates);
        return center;
    } catch(e) {
        console.warn('no coordinates', geoJson);
        return false;
    }
}
export function getFeatureCenter(feature: FeatureLike): false |  { longitude: number; latitude: number; } {
    const ext = feature.getGeometry()?.getExtent();
    if (!ext) return false;

    const center = getExtentCenter(ext);
    return {
        longitude: center[0],
        latitude: center[1],
    };
}

/**
 * 指定のfeatureが指定のlayerに含まれるか返す
 * @param feature 
 * @param layer 
 * @returns 
 */
export function containFeatureInLayer(feature: Feature<Geometry>, layer: VectorLayer<VectorSource>): boolean {
    let source = layer.getSource();
    if (source instanceof Cluster) {
        source = source.getSource();
    }
    return source?.hasFeature(feature) ?? false;
}

/**
 * 2つのエクステントの関係を判断する
 * @param ext1 
 * @param ext2 
 * @return ext2がext1に包含されている場合、1。ext1がext2に包含されている場合、2。包含関係にない場合、0。
 */
export function checkContaining(ext1: Extent, ext2: Extent) {
    const isContain1in2 = (ext1: Extent, ext2: Extent) => {
        if (ext1[0] < ext2[0]) return false;
        if (ext1[2] > ext2[2]) return false;
        if (ext1[1] < ext2[1]) return false;
        if (ext1[3] > ext2[3]) return false;
        return true;
    }

    if (isContain1in2(ext1, ext2)) {
        return 2;
    }
    if (isContain1in2(ext2, ext1)) {
        return 1;
    }
    return 0;
}

export function geoJsonToTurfPolygon(geoJson: geojson.Geometry | geojson.GeoJSON) {
    try {
        switch(geoJson.type) {
            case 'Polygon':
                return polygon(geoJson.coordinates);
            case 'MultiPolygon':
                return multiPolygon(geoJson.coordinates);
            case 'Point':
                return circle(geoJson.coordinates, .05);
            case 'LineString':
                return buffer(lineString(geoJson.coordinates), 0.05);
            case 'MultiLineString':
                return buffer(multiLineString(geoJson.coordinates), 0.05);
        }
    
    } catch(e) {
        console.warn('geoJsonToTurfPolygon faile', geoJson, e);
        return;
    }
}