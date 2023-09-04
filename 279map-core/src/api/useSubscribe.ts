import { useCallback, useMemo, useEffect } from 'react';
import { ErrorType, PublishMapMessage, PublishUserMessage } from 'tsunagumap-api';
import { connectStatusLoadableAtom, instanceIdAtom, mapIdAtom } from '../store/session';
import { MapKind } from '279map-common';
import { MyError } from '.';
import { useAtom } from 'jotai';
import { MqttClient } from "mqtt/*";
// @ts-ignore mqtt/dist配下にアクセスできないので、コピーしてきたものをimportしている
import * as mqtt from '../util/mqtt.min';
import { TsunaguMapProps } from "../types/types";

const instansMap = new Map<string, MqttClient>();
/**
 * MQTTClietnインスタンスを生成する
 * @param id instanceを特定するID
 */
export function createMqttClientInstance(id: string, mapServer: TsunaguMapProps['mapServer']) {
    const protocol = mapServer.ssl ? 'wss' : 'ws';
    const mq = mqtt.connect(`${protocol}://${mapServer.host}`) as MqttClient;
    mq.on('connect', () => {
        console.log('mqtt connected', id);
    });

    instansMap.set(id, mq);
    return mq;
}

export function destroyMqttClientInstance(id: string) {
    const mq = instansMap.get(id);
    if (!mq) return;
    instansMap.delete(id);
    mq.end(() => {
        console.log('mqtt disconnect', id);
    });
}

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
    const [ mapInstanceId ] = useAtom(instanceIdAtom);
    const [ mapId ] = useAtom(mapIdAtom);
    const [ connectStatusLoadable ] = useAtom(connectStatusLoadableAtom);

    const userId = useMemo(() => {
        if (connectStatusLoadable.state === 'hasError') {
            const e = connectStatusLoadable.error as any;
            const error: MyError = ('apiError' in e) ? e.apiError
                                : {type: ErrorType.IllegalError, detail: e + ''};
            return error?.userId;
        } else if (connectStatusLoadable.state === 'hasData') {
            return connectStatusLoadable.data.userId;
        } else {
            return undefined;
        }
    }, [connectStatusLoadable]);

    useEffect(() => {
        console.log('userId', userId)
    }, [userId]);

    /**
     * ログイン中のユーザに関するtopicを購読
     */
    const userSubscribe = useMemo(() => {
        if (!userId) {
            return;
        }
        const mqtt = instansMap.get(mapInstanceId);
        if (!mqtt) {
            console.warn('mqtt not find');
            return;
        }

        const subscribe = (msg: PublishUserMessage['type'], callback: (payload: PublishUserMessage) => void) => {
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
        }

        const unsubscribe = (msg: PublishUserMessage['type']) => {
            const topic = `${userId}/${msg}`;
            mqtt.unsubscribe(topic, () => {
                console.log('unsubscribe', topic)
            });
        }

        return {
            subscribe,
            unsubscribe,
        }

    }, [userId, mapInstanceId]);

    /**
     * 接続中の地図に関するtopicを購読
     */
    const subscribeMap = 
        useCallback((msg: PublishMapMessage['type'], mapKind: MapKind | undefined, param: PublishMapMessage['subtype'], callback: (payload: PublishMapMessage) => void) => {
            const mqtt = instansMap.get(mapInstanceId);
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
            const mqtt = instansMap.get(mapInstanceId);
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
        subscribeMap,
        unsubscribeMap,
        userSubscribe,
    }
}