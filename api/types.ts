export type APIDefine<PARAM, RESULT> = {
    uri: string;
    method: 'post' | 'get';
    param: PARAM;
    result: RESULT;
}
