/**
 * API interface
 */
export type APIDefine<PARAM, RESULT> = {
    uri: string;
    method: 'post' | 'get';
    resultType: 'json' | 'blob' | 'string' | 'none';
    param: PARAM;
    result: RESULT;
}
