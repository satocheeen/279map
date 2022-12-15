import { useSelector } from "react-redux";
import { useCallback } from 'react';
import { RootState, useAppDispatch } from "../store/configureStore";
import { callApi } from "./api";
import { api } from '279map-common';
import { registContent } from '../store/data/dataThunk';

/**
 * Parts側から呼び出し可能なコマンド
 */
export function useCommand() {
    const mapServer = useSelector((state: RootState) => state.session.mapServer);
    const dispatch = useAppDispatch();

    const registContentAPI = useCallback(async(param: api.RegistContentParam) => {
        await dispatch(registContent(param));

    }, [dispatch]);

    const getSnsPreviewAPI = useCallback(async(url: string) => {
        const res = await callApi(mapServer, api.GetSnsPreviewAPI, {
            url,
        });
        return res;
    }, [mapServer]);

    return {
        registContentAPI,
        getSnsPreviewAPI,
    }
}
export type CommandHookType = ReturnType<typeof useCommand>;
