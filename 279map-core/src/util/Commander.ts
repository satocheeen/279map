import { DataId, FeatureType, MapKind } from "279map-common";

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
    // 建設or地点登録 引数: 対象のDataSourceId
    TCommandDefine<'DrawStructure', string>
    // 移築
    | TCommandDefine<'MoveStructure', undefined>
    // 改築
    | TCommandDefine<'ChangeStructure', undefined>
    // 名称変更
    | TCommandDefine<'RenameStructure', undefined>
    // 解体（建物）
    | TCommandDefine<'RemoveStructure', undefined>
    // 島作成、緑地化、エリア登録
    | TCommandDefine<'DrawTopography', { dataSourceId: string; featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA }>
    // 道作成 引数: 対象のDataSourceId
    | TCommandDefine<'DrawRoad', string>
    // 変更
    | TCommandDefine<'EditTopography', undefined>
    // 土木情報編集
    | TCommandDefine<'EditTopographyInfo', undefined>
    // 解体
    | TCommandDefine<'RemoveTopography', undefined>
    // 最新地図アイテム取得命令
    | TCommandDefine<'LoadLatestData', undefined>
    // コンテンツ情報表示 引数: contentId. 
    | TCommandDefine<'ShowContentInfo', DataId>
    // 指定のアイテムにフォーカスする
    | TCommandDefine<'FocusItem', DataId>
    // 地図種別を切り替える
    | TCommandDefine<'ChangeMapKind', MapKind>
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