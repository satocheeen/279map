import axios from "axios";
import { Geometry } from "geojson";
import { getLogger } from "log4js";
import { MapboxAccessToken } from "../config";
import { GeocoderItem, GeocoderTarget, QueryGeocoderArgs, QueryGetGeocoderFeatureArgs } from "../graphql/__generated__/types";
import { GeocoderIdInfo } from "../types-common/common-types";

type OSMGeocordingResult = {
    boundingbox: [number, number, number, number];
    class: string;
    display_name: string;
    importance: number;
    lat: string;
    lon: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    type: string;
    licence: string;
    geojson?: Geometry;
}[];
type MapboxResult = {
    type: string;
    query: string[];
    features: {
        id: string;
        type: string;
        place_type: string[];
        text: string;
        place_name: string;
        bbox: [number, number, number, number];
        center: [number, number];
        geometry: Geometry;
    }[];
}

const logger = getLogger('api');

export async function geocoder(param: QueryGeocoderArgs): Promise<GeocoderItem[]> {
    const address = param.address;

    try {
        const result = await mapboxSearch(address, param.searchTarget);
        if (result.length > 0)
            return result;

    } catch(e) {
        logger.warn('Mapbox geocoding failed.', e);
    }
    
    try {
        const result = await osmSearch(address, param.searchTarget);
        return result;

    } catch(e) {
        logger.warn('OSM geocoding failed.', e);
    }
    return [];
}

async function mapboxSearch(address: string, searchTarget: GeocoderTarget[]): Promise<GeocoderItem[]> {
    let url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + address + '.json?access_token=' + MapboxAccessToken;
    url = encodeURI(url);

    const result = await axios({
        url,
    });
    const resultJson = result.data as MapboxResult;
    const list = resultJson.features.filter(feature => {
        if (feature.geometry.type === 'Point') {
            return searchTarget.includes(GeocoderTarget.Point);
        } else {
            if(!searchTarget.includes(GeocoderTarget.Area)) {
                return false;
            }
            // サイズが大きいものは弾く TODO: 間引いたものを生成する
            return JSON.stringify(feature.geometry).length < 1800;
        }
    }).map((res): GeocoderItem => {
        return {
            idInfo: {
                map: 'mapbox',
                id: res.id,
            },
            name: res.place_name,
            geoJson: res.geometry,
        };
    });
    return list;
};

async function osmSearch(address: string, searchTarget: GeocoderTarget[]): Promise<GeocoderItem[]> {
    let url = 'https://nominatim.openstreetmap.org/search?q=' + address + '&format=json&polygon_geojson=1';
    url = encodeURI(url);

    const result = await axios({
        url,
    });
    const resultJson = result.data as OSMGeocordingResult;

    const list = resultJson.filter(res => {
        if (!res.geojson) {
            return false;
        }
        if (res.geojson.type === 'Point') {
            return searchTarget.includes(GeocoderTarget.Point);
        } else {
            return searchTarget.includes(GeocoderTarget.Area);
        }
    }).map((res): GeocoderItem => {
        return {
            idInfo: {
                map: 'osm',
                osm_type: res.osm_type,
                osm_id: res.osm_id,
            },
            name: res.display_name,
            geoJson: res.geojson as Geometry,
        }
    });
    return list;
};

export async function getGeocoderFeature(param: QueryGetGeocoderFeatureArgs): Promise<Geometry> {
    const result = await getFeatureById(param.id);

    return result;
}

/**
 * 指定のIDに対応するGeoJsonを返す
 * @param id 
 */
async function getFeatureById(id: GeocoderIdInfo): Promise<Geometry> {
    if (id.map === 'mapbox') {
        throw '現状、対応外';
    }
    const idStr = (id.osm_type??'')[0].toUpperCase() + id.osm_id;
    const url = 'https://nominatim.openstreetmap.org/lookup?osm_ids=' + idStr + '&format=json&polygon_geojson=1';

    const result = await axios({
        url,
    });
    const resultJson = result.data as OSMGeocordingResult;

    if (resultJson.length === 0 || !resultJson[0].geojson) {
        throw 'Not found';
    }
    return resultJson[0].geojson;
}