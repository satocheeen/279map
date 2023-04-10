export enum ErrorType {
    UndefinedMap = 'UndefinedMap',  // 指定の地図が存在しない場合
    Unauthorized = 'Unauthorized',    // ログインが必要な場合
    Forbidden = 'Forbidden',  // ユーザが地図に対する権限を持たない場合
    OperationForbidden = 'OperationForbidden',  // 編集権限を持たないユーザが編集権限の必要なAPIを実行しようとした場合
    SessionTimeout = 'SessionTimeout',  // セッションタイムアウト時
    IllegalError = 'IllegalError',  // その他接続エラー
}
export type ApiError = {
    type: ErrorType;
    detail?: string;
}
