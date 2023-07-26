import mqtt from "precompiled-mqtt";

const instansMap = new Map<string, mqtt.Client>();

/**
 * MQTTClietnインスタンスを生成する
 * @param id instanceを特定するID
 */
export function createMqttClientInstance(id: string, host: string, sid: string) {
    const mq = mqtt.connect("mqtt://" + host, {
        clientId: sid,
    });
    mq.on('connect', () => {
        console.log('mqtt server connected');
    });

    instansMap.set(id, mq);
    return mq;
}
export function getMqttClientInstance(id: string) {
    return instansMap.get(id);
}
