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
    const mq = mqtt.connect(`${protocol}://${mapServer.host}`);
    mq.on('connect', () => {
        console.log('mqtt server connected');
    });

    instansMap.set(id, mq);
    return mq;
}
export function getMqttClientInstance(id: string) {
    return instansMap.get(id);
}
