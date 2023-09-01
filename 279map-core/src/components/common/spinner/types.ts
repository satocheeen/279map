export type ProcessMessageType = {
    overlay: boolean;   // trueの場合、オーバーレイ表示。falseの場合、ユーザ操作を阻害しない位置に表示
    spinner: boolean;   // trueの場合、スピナー表示
    message?: string;
}
export type ProcessMessageWithID = ProcessMessageType & {
    id: number;
}
