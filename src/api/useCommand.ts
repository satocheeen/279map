import { useSelector } from "react-redux";
import { useCallback } from 'react';
import { RootState, useAppDispatch } from "../store/configureStore";
import { callApi } from "./api";
import { api } from '279map-common';
import { registContent, updateContent, linkContentToItem } from '../store/data/dataThunk';
import useConfirm from "../components/common/confirm/useConfirm";

/**
 * Parts側から呼び出し可能なコマンド
 */
export function useCommand() {
    const mapServer = useSelector((state: RootState) => state.session.mapServer);
    const dispatch = useAppDispatch();
    const { confirm } = useConfirm();

    const registContentAPI = useCallback(async(param: api.RegistContentParam) => {
        await dispatch(registContent(param));

    }, [dispatch]);

    const updateContentAPI = useCallback(async(param: api.UpdateContentParam) => {
        await dispatch(updateContent(param));

    }, [dispatch]);

    const linkContentToItemAPI = useCallback(async(param: api.LinkContentToItemParam) => {
        await dispatch(linkContentToItem(param));
    }, [dispatch]);

    const getSnsPreviewAPI = useCallback(async(url: string) => {
        const res = await callApi(mapServer, api.GetSnsPreviewAPI, {
            url,
        });
        return res;
    }, [mapServer]);

    return {
        confirm,
        registContentAPI,
        updateContentAPI,
        linkContentToItemAPI,
        getSnsPreviewAPI,
    }
}
export type CommandHookType = ReturnType<typeof useCommand>;
