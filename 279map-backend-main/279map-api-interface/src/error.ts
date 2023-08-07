export enum ErrorType {
    UndefinedMap = 'UndefinedMap',  // 指定の地図が存在しない場合
    Unauthorized = 'Unauthorized',    // 地図が認証必要だが、ユーザがtokenを持たない場合（＝ログインが必要な場合）
    Forbidden = 'Forbidden',  // ユーザのtokenが有効切れの場合
    NoAuthenticate = 'NoAuthenticate', // Private地図に対して、アクセス権限のないユーザがアクセスしようとした場合
    Requesting = 'Requesting', // Private地図の登録申請中の場合
    OperationForbidden = 'OperationForbidden',  // 編集権限を持たないユーザが編集権限の必要なAPIを実行しようとした場合
    SessionTimeout = 'SessionTimeout',  // セッションタイムアウト時
    IllegalError = 'IllegalError',  // その他接続エラー
}
export type ApiError = {
    type: ErrorType;
    detail?: string;
    userId?: string;    // userIDは判明している場合、クライアントに送る
}
