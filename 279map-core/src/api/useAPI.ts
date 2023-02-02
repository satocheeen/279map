import { GetGeoCoderFeatureResult } from 'tsunagumap-api';
import { GeocoderId } from '279map-common';
import { GeoJsonObject } from 'geojson';
import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/configureStore';

export function useAPI() {
    const mapServer = useSelector((state: RootState) => state.session.mapServer);

    const serverUrl = useMemo(() => {
        const protocol = mapServer.ssl ? 'https' :'http';
        const domain = mapServer.domain;

        return `${protocol}://${domain}/`;

    }, [mapServer]);

    const apiUrl = useMemo(() => {
        return serverUrl + 'api/';

    }, [serverUrl]);

    const getGeocoderFeature = useCallback(async(id: GeocoderId): Promise<GeoJsonObject> => {
        const param = Object.entries(id).reduce((acc, cur) => {
            const key = cur[0];
            const value = cur[1];
            return acc + (acc.length > 0 ? '&' : '') + key + '=' + value;
        }, '');
        const res = await fetch(apiUrl + 'getGeocoderFeature?' + param);
        const json = await res.json() as GetGeoCoderFeatureResult;
        return json.geoJson;
    }, [apiUrl]);

    return {
        apiUrl,
        getGeocoderFeature,
    }
}