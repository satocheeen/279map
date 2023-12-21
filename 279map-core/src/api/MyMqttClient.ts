import { MqttClient } from "mqtt/*";
import { ServerInfo } from "../types/types";
// @ts-ignore mqtt/dist配下にアクセスできないので、コピーしてきたものをimportしている
import * as mqtt from '../util/mqtt.min';
import { PublishMapMessage } from "tsunagumap-api";
import { MapKind } from "279map-common";

type Callback = (payload: PublishMapMessage) => void;
type CallbackInfo = {
    id: number;
    topic: string;
    callback: Callback;
}

let callbackCnt = 0;
export class MyMqttClient {
    _id: string;
    _mq: MqttClient;
    _callbackMap = new Map<number, CallbackInfo>();
    _topicMap = new Map<string, number[]>();   // key=topic, value=id

    _mapId: string;
    _userId: string | undefined;

    constructor(id: string, mapServer: ServerInfo, mapId: string) {
        this._mapId = mapId;
        const protocol = mapServer.ssl ? 'wss' : 'ws';
        const mq = mqtt.connect(`${protocol}://${mapServer.host}`) as MqttClient;
        mq.on('connect', () => {
            console.log('mqtt connected', id);
        });

        mq.on('message', (topic, payloadBuff) => {
            const callbackIdList = this._topicMap.get(topic);
            if (!callbackIdList) return;
            const payload = JSON.parse(new String(payloadBuff) as string) as PublishMapMessage;
            console.log('message', topic, payload);
            callbackIdList.forEach(id => {
                const callbackInfo = this._callbackMap.get(id);
                if (!callbackInfo) {
                    console.warn('callback not find', id);
                    return;
                }
                callbackInfo.callback(payload);

            })
        });
    
        this._id = id;
        this._mq = mq;
    }

    dispose() {
        this._mq.end(() => {
            console.log('mqtt disconnect', this._id);
        });    
    }

    setUser(userId: string | undefined) {
        // TODO: 現在のユーザと変わったら、既存のcallbackは破棄する
        this._userId = userId;
    }

    /**
     * 地図に対する指定のトピックの購読を開始する
     * @param target 
     * @param msg 
     * @param subType 
     * @param callback 
     * @returns 購読id。unsubscribe時に渡す。
     */
    subscribeMap(target: {mapKind: MapKind}, msg: PublishMapMessage['type'], subType: PublishMapMessage['subtype'], callback: Callback) {
        if (!this._mapId) {
            console.warn('not fount mapId');
            return;
        }
        const mytopic = makeTopic(this._mapId, target.mapKind, msg, subType);
        return this._subscribe(mytopic, callback);
    }

    _subscribe(mytopic: string, callback: Callback) {
        const id = ++callbackCnt;
        const info: CallbackInfo = {
            id,
            topic: mytopic,
            callback,
        };
        this._callbackMap.set(id, info);
        if (this._topicMap.has(mytopic)) {
            this._topicMap.get(mytopic)?.push(id);
        } else {
            this._topicMap.set(mytopic, [id]);
            this._mq.subscribe(mytopic, () => {
                console.log('subscribe', this._id, mytopic)
            });
        }
        return id;
    }

    unsubscribe(id: number) {
        const callbackInfo = this._callbackMap.get(id);
        if (!callbackInfo) {
            console.warn('callback not found', id);
            return;
        }
        const topic = callbackInfo.topic;
        this._callbackMap.delete(id);

        const topicIdList = this._topicMap.get(topic);
        if (topicIdList) {
            const newIdList = topicIdList.filter(id => callbackInfo.id !== id);
            if (newIdList.length > 0) {
                this._topicMap.set(topic, newIdList);
            } else {
                this._topicMap.delete(topic);
                this._mq.unsubscribe(topic, () => {
                    console.log('unsubscribe', this._id, topic);
                });
            }
        }
        console.log('unsubscribe', callbackInfo);
    }
}

function makeTopic(mapId: string, mapKind: MapKind, msg: PublishMapMessage['type'], param: PublishMapMessage['subtype']) {
    const paramStr = function() {
        if (param === undefined) return undefined;
        if (typeof param === 'object') {
            return JSON.stringify(param);
        }
        return param + '';
    }();
    return `${mapId}/${mapKind}/${msg}${paramStr ? '/' + paramStr : ''}`;
}
