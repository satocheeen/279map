import { getLogger } from 'log4js';
import { Server } from 'http';
import mosca from 'mosca';
import { WebSocketMessage } from '../../279map-api-interface/src';
import { MapKind } from '279map-common';
import { MqttClient } from 'mqtt/*';

const mqtt = require('mqtt');

const apiLogger = getLogger('api');
export default class MqttBroadcaster {
    #server: mosca.Server;
    #mqttClient: MqttClient | undefined;

    constructor(server: Server) {
        this.#server = new mosca.Server({});
        this.#server.attachHttpServer(server);

        this.#server.on('ready', () => { 
            console.log('Mosca Serve is ready')

            this.#mqttClient = mqtt.connect('mqtt://localhost') as MqttClient;
            this.#mqttClient.on('connect', () => {
                console.log('mqtt server connected');
            });
            this.#mqttClient.on('error', (err) => {
                console.log('mqtt error', err);
            });
        });

        this.#server.on('clientConnected', (client: any) => {
            apiLogger.info('mqtt client conneted', client.id);
        });
        this.#server.on('subscribed', (topic: any) => {
            apiLogger.info('mqtt client subscribed', topic);
        });
    }

    /**
     * 対象の地図に接続しているユーザに対して、通知を一斉送信する
     * @param mapPageId 対象の地図ページID
     * @param mapKind 対象の地図種別。未指定の場合は、地図種別に関わらず送信する。
     * @param message 送信する通知
     */
    broadcast(mapPageId: string, mapKind: MapKind | undefined, message: WebSocketMessage) {
        apiLogger.debug('broadcast', mapKind, message);
        if (!this.#mqttClient) {
            apiLogger.warn('mqtt client not find');
            return;
        }
        const mqttClient = this.#mqttClient;

        const mapKinds = mapKind ? [mapKind] : [MapKind.Real, MapKind.Virtual];
        mapKinds.forEach(mk => {
            const topic = `${mapPageId}/${mk}/${message.type}`;
            mqttClient.publish(topic, JSON.stringify(message));
            apiLogger.debug('publish', topic);
        })
    }

}
