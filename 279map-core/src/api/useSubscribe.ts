import { useCallback } from 'react';
import { instanceIdAtom } from '../store/session';
import { TsunaguMapProps } from "../types/types";
import { MyMqttClient } from './MyMqttClient';
import { useAtomCallback } from 'jotai/utils';

const instansMap = new Map<string, MyMqttClient>();
/**
 * MQTTClietnインスタンスを生成する
 * @param id instanceを特定するID
 */
export function createMqttClientInstance(id: string, mapServer: TsunaguMapProps['mapServer'], mapId: string) {
    if (instansMap.has(id)) {
        destroyMqttClientInstance(id);
    }
    const mq = new MyMqttClient(id, mapServer, mapId);
    instansMap.set(id, mq);
}

export function destroyMqttClientInstance(id: string) {
    const mq = instansMap.get(id);
    if (!mq) return;
    instansMap.delete(id);
    mq.dispose();
}

export function useSubscribe() {

    const getSubscriber = useAtomCallback(
        useCallback((get) => {
            const instanceId = get(instanceIdAtom);
            return instansMap.get(instanceId);
        }, [])
    )

    return {
        getSubscriber,
    }
}