import { getLogger } from 'log4js';
import { Server } from 'http';
import aedes from 'aedes';
import { PublishMapMessage, PublishUserMessage } from '../../279map-api-interface/src';
import { MapKind } from '279map-common';
import ws from 'websocket-stream';

const apiLogger = getLogger('api');
export default class MqttBroadcaster {
    #server: aedes;

    constructor(server: Server) {
        this.#server = aedes.createBroker();

        // @ts-ignore
        ws.createServer({ server }, this.#server.handle);

        this.#server.on('client', (client: any) => {
            apiLogger.info('mqtt client conneted', client.id);
        });
        this.#server.on('subscribe', (topic: any) => {
            apiLogger.info('mqtt client subscribed', topic);
        });
    }

    /**
     * 対象のユーザに大して通知を送信する
     * @param userId 
     */
    publishUserMessage(userId: string, message: PublishUserMessage) {
        const topic = `${userId}/${message.type}`;
        apiLogger.debug('publish user', topic);
        this.#server.publish({
            cmd: 'publish',
            topic,
            dup: false,
            payload: JSON.stringify(message),
            qos: 2,
            retain: false,
        }, (err) => {
            console.warn('publish err', err);
        });
    }

    /**
     * 対象の地図に接続しているユーザに対して、通知を一斉送信する
     * @param mapPageId 対象の地図ページID
     * @param mapKind 対象の地図種別。未指定の場合は、地図種別に関わらず送信する。
     * @param message 送信する通知
     */
    publish(mapPageId: string, mapKind: MapKind | undefined, message: PublishMapMessage) {
        apiLogger.debug('broadcast', mapKind, message);

        const mapKinds = mapKind ? [mapKind] : [MapKind.Real, MapKind.Virtual];
        mapKinds.forEach(mk => {
            const topic = makeTopic(mapPageId, mk, message.type, message.param);
            this.#server.publish({
                cmd: 'publish',
                topic,
                dup: false,
                payload: JSON.stringify(message),
                qos: 2,
                retain: false,
            }, (err) => {
                console.warn('publish err', err);
            });
            apiLogger.debug('publish', topic);
        })
    }

}
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
