import { MqttClient } from "mqtt/*";
// @ts-ignore mqtt/dist配下にアクセスできないので、コピーしてきたものをimportしている
import * as mqtt from '../../util/mqtt.min';
import { TsunaguMapProps } from "../../types/types";

const instansMap = new Map<string, MqttClient>();

/**
 * MQTTClietnインスタンスを生成する
 * @param id instanceを特定するID
 */
export function createMqttClientInstance(id: string, mapServer: TsunaguMapProps['mapServer']) {
    const protocol = mapServer.ssl ? 'wss' : 'ws';
    const mq = mqtt.connect(`${protocol}://${mapServer.host}`) as MqttClient;
    mq.on('connect', () => {
        console.log('mqtt connected');
    });

    instansMap.set(id, mq);
    return mq;
}

export function destroyMqttClientInstance(id: string) {
    const mq = instansMap.get(id);
    if (!mq) return;
    instansMap.delete(id);
    mq.end(() => {
        console.log('mqtt disconnect');
    });
}
export function getMqttClientInstance(id: string) {
    return instansMap.get(id);
}
