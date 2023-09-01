import { useContext, useCallback, useMemo } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { ApiError, PublishMapMessage, PublishUserMessage } from 'tsunagumap-api';
import { getMqttClientInstance } from '../store/session/MqttInstanceManager';
import { connectStatusLoadableAtom } from '../store/session';
import { MapKind } from '279map-common';
import { ApiException } from '../api';
import { useAtom } from 'jotai';

function makeTopic(mapId: string, mapKind: MapKind | undefined, msg: PublishMapMessage['type'], param: PublishMapMessage['subtype']) {
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
    const [ connectStatusLoadable ] = useAtom(connectStatusLoadableAtom);

    const userId = useMemo(() => {
        if (connectStatusLoadable.state === 'hasError') {
            const e = connectStatusLoadable.error;
            const error: ApiError | undefined = (e instanceof ApiException) ? e.apiError : undefined;
            return error?.userId;
        } else if (connectStatusLoadable.state === 'hasData') {
            return connectStatusLoadable.data.userId;
        } else {
            return undefined;
        }
    }, [connectStatusLoadable]);

    /**
     * 接続中のユーザに関するtopicを購読
     */
    const subscribeUser = useCallback((msg: PublishUserMessage['type'], callback: (payload: PublishUserMessage) => void) => {
        if (!userId) {
            console.warn('not yet connected.');
            return;
        }
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        
        const mytopic = `${userId}/${msg}`;
        mqtt.subscribe(mytopic, () => {
            console.log('subscribe', mytopic)
        });
        mqtt.on('message', (topic, payloadBuff) => {
            const payload = JSON.parse(new String(payloadBuff) as string) as PublishUserMessage;
            if (mytopic === topic) {
                console.log('message', topic, payload);
                callback(payload);
            }
        });
    }, [userId, mapInstanceId]);

    /**
     * 接続中のユーザに関するtopicの購読停止
     */
    const unsubscribeUser = useCallback((msg: PublishUserMessage['type']) => {
        if (connectStatusLoadable.state !== 'hasData') {
            console.warn('not yet connected.');
            return;
        }
        const connectStatus = connectStatusLoadable.data;
        const mqtt = getMqttClientInstance(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }
        const topic = `${connectStatus.userId}/${msg}`;
        mqtt.unsubscribe(topic, () => {
            console.log('unsubscribe', topic)
        });

    }, [connectStatusLoadable, mapInstanceId]);

    /**
     * 接続中の地図に関するtopicを購読
     */
    const subscribeMap = 
        useCallback((msg: PublishMapMessage['type'], mapKind: MapKind | undefined, param: PublishMapMessage['subtype'], callback: (payload: PublishMapMessage) => void) => {
            const mqtt = getMqttClientInstance(mapInstanceId);
            if (!mqtt) {
                console.warn('mqtt not find');
                return;
            }

            const mytopic = makeTopic(mapId, mapKind, msg, param);
            mqtt.subscribe(mytopic, () => {
                console.log('subscribe', mytopic)
            });
            mqtt.on('message', (topic, payloadBuff) => {
                const payload = JSON.parse(new String(payloadBuff) as string) as PublishMapMessage;
                if (mytopic === topic) {
                    console.log('message', topic, payload);
                    callback(payload);
                }
            });

        }, [mapInstanceId, mapId]);

    /**
     * 接続中の地図に関するtopicの購読停止
     */
    const unsubscribeMap = 
        useCallback((msg: PublishMapMessage['type'], mapKind: MapKind | undefined, param: PublishMapMessage['subtype']) => {
            const mqtt = getMqttClientInstance(mapInstanceId);
            if (!mqtt) {
                console.warn('mqtt not find');
                return;
            }
            const topic = makeTopic(mapId, mapKind, msg, param);
            mqtt.unsubscribe(topic, () => {
                console.log('unsubscribe', topic)
            });

        }, [mapInstanceId, mapId]);

    return {
        subscribeUser,
        unsubscribeUser,
        subscribeMap,
        unsubscribeMap,
    }
}