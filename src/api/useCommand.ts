import { useSelector } from "react-redux";
import { useCallback } from 'react';
import { RootState, useAppDispatch } from "../store/configureStore";
import { callApi } from "./api";
import { api, MapKind, UnpointContent } from '279map-common';
import { registContent, updateContent, linkContentToItem } from '../store/data/dataThunk';
import useConfirm from "../components/common/confirm/useConfirm";
import { operationActions } from "../store/operation/operationSlice";

/**
 * Parts側から呼び出し可能なコマンド
 */
export function useCommand() {
    const mapServer = useSelector((state: RootState) => state.session.mapServer);
    const dispatch = useAppDispatch();
    const { confirm } = useConfirm();

    /**
     * 表示する地図種別の切り替え
     */
    const switchMapKind = useCallback((mapKind: MapKind) => {
        dispatch(operationActions.setMapKind(mapKind));
    }, [dispatch]);

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

    const getUnpointDataAPI = useCallback(async(nextToken?: string) => {
        const result = await callApi(mapServer, api.GetUnpointDataAPI, {
            nextToken,
        });
        return {
            contents: result.contents as UnpointContent[],
            nextToken: result.nextToken,
        };

    }, [mapServer]);

    return {
        switchMapKind,
        confirm,
        registContentAPI,
        updateContentAPI,
        linkContentToItemAPI,
        getSnsPreviewAPI,
        getUnpointDataAPI,
    }
}
export type CommandHookType = ReturnType<typeof useCommand>;
