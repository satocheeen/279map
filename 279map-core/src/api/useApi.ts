import { useCallback, useMemo } from 'react';
import { useAtomCallback } from 'jotai/utils';
import { serverInfoAtom, connectStatusAtom } from '../store/session';
import { useAtom } from 'jotai';
import { callApi as callApiFunc } from './api';
import { APIDefine } from '279map-common';

type CallFuncType = <API extends APIDefine<any, any>>(api: API, param: API['param']) => Promise<API['result']>
export function useApi() {
    const [ serverInfo ] = useAtom(serverInfoAtom);

    const callApi: CallFuncType = useAtomCallback(
        useCallback(async(get, set, api, param) => {
            // @ts-ignore
            const sid = (await get(connectStatusAtom)).sid;
            return callApiFunc(serverInfo, sid, api, param);
        }, [serverInfo])
    )

    const hasToken = useMemo(() => {
        return serverInfo.token !== undefined;
    }, [serverInfo]);

    return {
        callApi,
        hasToken,
    }
}