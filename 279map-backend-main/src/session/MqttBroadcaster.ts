import { getLogger } from 'log4js';
import { Server } from 'http';
import aedes from 'aedes';
import { WebSocketMessage } from '../../279map-api-interface/src';
import { MapKind } from '279map-common';
import Aedes from 'aedes/types/instance';
import ws from 'websocket-stream';

const apiLogger = getLogger('api');
export default class MqttBroadcaster {
    #server: Aedes;

    constructor(server: Server) {
        this.#server = new aedes();

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
     * 対象の地図に接続しているユーザに対して、通知を一斉送信する
     * @param mapPageId 対象の地図ページID
     * @param mapKind 対象の地図種別。未指定の場合は、地図種別に関わらず送信する。
     * @param message 送信する通知
     */
    broadcast(mapPageId: string, mapKind: MapKind | undefined, message: WebSocketMessage) {
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
function makeTopic(mapId: string, mapKind: MapKind | undefined, msg: WebSocketMessage['type'], param: WebSocketMessage['param']) {
    const paramStr = function() {
        if (param === undefined) return undefined;
        if (typeof param === 'object') {
            return JSON.stringify(param);
        }
        return param + '';
    }();
    return `${mapId}/${mapKind}/${msg}${paramStr ? '/' + paramStr : ''}`;
}
