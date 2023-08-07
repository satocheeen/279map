import { useContext, useCallback, useMemo } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { ApiError, PublishMapMessage, PublishUserMessage } from 'tsunagumap-api';
import { getMqttClientInstance } from '../store/session/MqttInstanceManager';
import { useRecoilValue, useRecoilValueLoadable } from 'recoil';
import { connectStatusState, currentMapKindState } from '../store/session';
import { MapKind } from '279map-common';
import { ApiException } from '../api';

function makeTopic(mapId: string, mapKind: MapKind | undefined, msg: PublishMapMessage['type'], param: PublishMapMessage['param']) {
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
    const connectStatusLoadable = useRecoilValueLoadable(connectStatusState);

    const userId = useMemo(() => {
        if (connectStatusLoadable.state === 'hasError') {
            const e = connectStatusLoadable.contents;
            const error: ApiError | undefined = (e instanceof ApiException) ? e.apiError : undefined;
            return error?.userId;
        } else if (connectStatusLoadable.state === 'hasValue') {
            return connectStatusLoadable.contents.userId;
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
        if (connectStatusLoadable.state !== 'hasValue') {
            console.warn('not yet connected.');
            return;
        }
        const connectStatus = connectStatusLoadable.contents;
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
    const subscribeMap = useCallback((msg: PublishMapMessage['type'], param: PublishMapMessage['param'], callback: (payload: PublishMapMessage) => void) => {
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
            const payload = JSON.parse(new String(payloadBuff) as string) as PublishMapMessage;
            if (mytopic === topic) {
                console.log('message', topic, payload);
                callback(payload);
            }
        });

    }, [mapInstanceId, mapId, currentMapKind]);

    /**
     * 接続中の地図に関するtopicの購読停止
     */
    const unsubscribeMap = useCallback((msg: PublishMapMessage['type'], param: PublishMapMessage['param']) => {
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
        subscribeUser,
        unsubscribeUser,
        subscribeMap,
        unsubscribeMap,
    }
}