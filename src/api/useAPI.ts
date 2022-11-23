import { GeocoderId, api } from '279map-common';
import { GeoJsonObject } from 'geojson';
import { useContext, useMemo, useCallback } from 'react';
import { OwnerContext } from "../components/TsunaguMap/TsunaguMap";

export function useAPI() {
    const ownerContext =  useContext(OwnerContext);

    const apiUrl = useMemo(() => {
        const protocol = ownerContext.mapServer.ssl ? 'https' :'http';
        const domain = ownerContext.mapServer.domain;

        return `${protocol}://${domain}/api/`;

    }, [ownerContext.mapServer]);

    const getGeocoderFeature = useCallback(async(id: GeocoderId): Promise<GeoJsonObject> => {
        const param = Object.entries(id).reduce((acc, cur) => {
            const key = cur[0];
            const value = cur[1];
            return acc + (acc.length > 0 ? '&' : '') + key + '=' + value;
        }, '');
        const res = await fetch(apiUrl + 'getGeocoderFeature?' + param);
        const json = await res.json() as api.GetGeoCoderFeatureResult;
        return json.geoJson;
    }, [apiUrl]);

    return {
        apiUrl,
        getGeocoderFeature,
    }
}