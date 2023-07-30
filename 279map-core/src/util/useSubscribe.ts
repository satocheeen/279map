import { useContext, useCallback } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { WebSocketMessage } from 'tsunagumap-api';
import { getMqttClientInstance } from '../store/session/MqttInstanceManager';
import { useRecoilValue } from 'recoil';
import { currentMapKindState } from '../store/map';

//TODO: 別の箇所から同一messageをsubscribeすると、片方がunsubscribeするともう一方もunsubscribeになると思うので、その対処
export function useSubscribe() {
    const { mapInstanceId, mapId } = useContext(OwnerContext);
    const currentMapKind = useRecoilValue(currentMapKindState);

    const subscribe = useCallback((msg: WebSocketMessage['type'], callback: (payload: WebSocketMessage) => void) => {
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        const topic = `${mapId}/${currentMapKind}/${msg}`;
        mqtt.subscribe(topic, () => {
            console.log('subscribe', topic)
        });
        mqtt.on('message', (topic, payloadBuff) => {
            const payload = JSON.parse(new String(payloadBuff) as string) as WebSocketMessage;
            if (payload.type === msg) {
                console.log('message', topic, payload);
                callback(payload);
            }
        });

    }, [mapInstanceId, mapId, currentMapKind]);

    const unsubscribe = useCallback((msg: WebSocketMessage['type']) => {
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        const topic = `${mapId}/${currentMapKind}/${msg}`;
        mqtt.unsubscribe(topic, () => {
            console.log('unsubscribe', topic)
        });

    }, [mapInstanceId, mapId, currentMapKind]);

    return {
        subscribe,
        unsubscribe,
    }
}