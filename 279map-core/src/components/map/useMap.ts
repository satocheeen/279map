import { useContext, useCallback } from 'react';
import { getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { getMqttClientInstance } from '../../store/session/MqttInstanceManager';

/**
 * MapWrapper配下のコンポーネントに対してmapインスタンス、apiインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const { mapInstanceId } = useContext(OwnerContext);

    const getMap = useCallback(() => {
        return getMapInstance(mapInstanceId);
    }, [mapInstanceId])

    const getApi = useCallback(() => {
        return getAPICallerInstance(mapInstanceId);
    }, [mapInstanceId])

    const getMqttClient = useCallback(() => {
        return getMqttClientInstance(mapInstanceId);
    }, [mapInstanceId]);

    return {
        getApi,
        getMap,
        getMqttClient,
    }
}