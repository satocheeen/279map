import { DataId, FeatureType, MapKind } from "279map-common";
import { Coordinate } from "ol/coordinate";

/**
 * 特定の処理を突き放し実行するための仕組み
 * doCommandでコマンドが呼び出されると、
 * あらかじめ登録されていたリスナーが呼び出される。
 */
type TCallBack<T> = (param: T) => Promise<void>;

type TCommandDefine<COMMAND extends string, PARAM> = {
    subscription: Parameters<(command: COMMAND, callback: TCallBack<PARAM>) => void>;
    execute: {
        command: COMMAND;
        param: PARAM;
    }
}
type CommandDefine = 
    // 名称変更
    | TCommandDefine<'RenameStructure', undefined>
    // アイテム情報表示 引数: itemId. 
    | TCommandDefine<'ShowItemInfo', DataId>
    // 重畳選択メニュー表示
    | TCommandDefine<'ShowClusterMenu', {position: Coordinate; targets: DataId[]}>
    ;
type TSubscription = CommandDefine['subscription'];
type TCallback = TSubscription[1];
export type CommandSet = CommandDefine['execute'];

let maxId = 0;
const listenerMap = {} as {[id: number]: {callback: TCallback; command: string}};
const commandListenerListMap = {} as {[command: string]: number[]}; // value = listenerId

export const addListener = (...param: TSubscription): number => {
    const command = param[0];
    const func = param[1];
    if (!(command in commandListenerListMap)) {
        commandListenerListMap[command] = [];
    }
    const id = ++maxId;
    listenerMap[id] = {
        callback: func,
        command,
    };
    commandListenerListMap[command].push(id);

    return id;
}

export const removeListener = (id: number) => {
    const listener = listenerMap[id];
    delete listenerMap[id];
    commandListenerListMap[listener.command] = commandListenerListMap[listener.command].filter(itemId => id !== itemId);
}

export const doCommand = async(param: CommandSet) => {
    if (!(param.command in commandListenerListMap)) {
        return;
    }
    await Promise.all(commandListenerListMap[param.command].map(listenerId => {
        const listener = listenerMap[listenerId].callback;
        return listener(param.param as never);
    }));
}