import { useContext, useCallback } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { WebSocketMessage } from 'tsunagumap-api';
import { getMqttClientInstance } from '../store/session/MqttInstanceManager';
import { useRecoilValue } from 'recoil';
import { currentMapKindState } from '../store/session';
import { MapKind } from '279map-common';

function makeTopic(mapId: string, mapKind: MapKind | undefined, msg: WebSocketMessage['type'], param: WebSocketMessage['param']) {
    const paramStr = function() {
        if (param === undefined) return undefined;
        if (typeof param === 'object') {
            return JSON.stringify(param);
        }
        return param + '';
    }();
    return `${mapId}/${mapKind}/${msg}${paramStr ? '/' + paramStr : ''}`;
}
//TODO: 別の箇所から同一messageをsubscribeすると、片方がunsubscribeするともう一方もunsubscribeになると思うので、その対処
export function useSubscribe() {
    const { mapInstanceId, mapId } = useContext(OwnerContext);
    const currentMapKind = useRecoilValue(currentMapKindState);

    const subscribe = useCallback((msg: WebSocketMessage['type'], param: WebSocketMessage['param'], callback: (payload: WebSocketMessage) => void) => {
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        const mytopic = makeTopic(mapId, currentMapKind, msg, param);
        mqtt.subscribe(mytopic, () => {
            console.log('subscribe', mytopic)
        });
        mqtt.on('message', (topic, payloadBuff) => {
            const payload = JSON.parse(new String(payloadBuff) as string) as WebSocketMessage;
            if (mytopic === topic) {
                console.log('message', topic, payload);
                callback(payload);
            }
        });

    }, [mapInstanceId, mapId, currentMapKind]);

    const unsubscribe = useCallback((msg: WebSocketMessage['type'], param: WebSocketMessage['param']) => {
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        const topic = makeTopic(mapId, currentMapKind, msg, param);
        mqtt.unsubscribe(topic, () => {
            console.log('unsubscribe', topic)
        });

    }, [mapInstanceId, mapId, currentMapKind]);

    return {
        subscribe,
        unsubscribe,
    }
}