import { useCallback } from 'react';
import { useAppDispatch } from "../store/configureStore";
import { DataId, FeatureType, MapKind, UnpointContent } from '279map-common';
import { registContent, updateContent, linkContentToItem, LoadContentsParam, loadContents, LoadContentsResult } from '../store/data/dataThunk';
import useConfirm from "../components/common/confirm/useConfirm";
import { doCommand } from "../util/Commander";
import { GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam, UpdateContentParam } from "tsunagumap-api";
import { getAPICallerInstance } from "./ApiCaller";
import { getMapInstance } from '../components/TsunaguMap/OlMapWrapper';

/**
 * Coreの外側から呼び出し可能なコマンド
 */
export function useCommand() {
    const dispatch = useAppDispatch();
    const { confirm } = useConfirm();

    /**
     * switch the map kind
     * 表示する地図種別の切り替え
     */
    const switchMapKind = useCallback((mapKind: MapKind) => {
        doCommand({
            command: 'ChangeMapKind',
            param: mapKind,
        });
    }, []);

    /**
     * focus the item
     * 指定のアイテムにフォーカスする
     * @param itemId フォーカス対象のアイテムid
     * @param opts フォーカスする際のオプション
     */
    const focusItem = useCallback((itemId: DataId, opts?: {zoom?: boolean}) => {
        doCommand({
            command: 'FocusItem',
            param: {
                itemId,
                zoom: opts?.zoom,
            }
        });
    }, []);

    /**
     * start the spte of drawing a structure (or a pin).
     * 建設または地点登録する
     */
    const drawStructure = useCallback((dataSourceId: string) => {
        doCommand({
            command: 'DrawStructure',
            param: dataSourceId,
        });
    }, []);

    /**
     * start the step of moving a structure (or a pin).
     * 移築または地点移動する
     */
    const moveStructure = useCallback(() => {
        doCommand({
            command: 'MoveStructure',
            param: undefined,
        });
    }, []);

    /**
     * start the step of changing a structure's icon.
     * 改築（建物変更）する
     */
    const changeStructure = useCallback(() => {
        doCommand({
            command: 'ChangeStructure',
            param: undefined,
        });
    }, []);

    /**
     * start the step of removing a structure.
     * 建物解体する
     */
    const removeStructure = useCallback(() => {
        doCommand({
            command: 'RemoveStructure',
            param: undefined,
        });
    }, []);

    /**
     * start the step of drawing a land, a green field or an area.
     * 島or緑地orエリアを作成する
     */
    const drawTopography = useCallback((dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA) => {
        doCommand({
            command: 'DrawTopography',
            param: {
                dataSourceId, 
                featureType,
            }
        });
    }, []);

    /**
     * start the step of drawing a road.
     * 道を作成する
     */
    const drawRoad = useCallback((dataSourceId: string) => {
        doCommand({
            command: 'DrawRoad',
            param: dataSourceId,
        });
    }, []);

    /**
     * start the step of modifying a topography.
     * 地形編集する
     */
    const editTopography = useCallback(()=>{
        doCommand({
            command:'EditTopography',
            param: undefined,
        });
    },[]);

    /**
     * start the step of removing a topography.
     * 地形削除する
     */
    const removeTopography = useCallback(() => {
        doCommand({
            command:'RemoveTopography',
            param: undefined,
        });
    }, []);

    const editTopographyInfo = useCallback(() => {
        doCommand({
            command:'EditTopographyInfo',
            param: undefined,
        });
    }, []);

    const loadContentsAPI = useCallback(async(param: LoadContentsParam): Promise<LoadContentsResult> => {
        const res = await dispatch(loadContents(param));
        if ('error' in res) {
            // @ts-ignore
            const errorMessage = res.payload?.message ?? '';
            throw new Error('registContentAPI failed.' + errorMessage);
        }
        return res.payload;
    }, [dispatch]);

    const showDetailDialog = useCallback(async(param: {type: 'item' | 'content'; id: DataId}) => {
        if (param.type === 'content') {
            doCommand({
                command: 'ShowContentInfo',
                param: param.id,
            });
        } else {
            doCommand({
                command: 'ShowItemInfo',
                param: param.id,
            });
        }
    }, []);

    const registContentAPI = useCallback(async(param: RegistContentParam) => {
        const res = await dispatch(registContent(param));
        if ('error' in res) {
            // @ts-ignore
            const errorMessage = res.payload?.message ?? '';
            throw new Error('registContentAPI failed.' + errorMessage);
        }
    }, [dispatch]);

    const updateContentAPI = useCallback(async(param: UpdateContentParam) => {
        await dispatch(updateContent(param));

    }, [dispatch]);

    const linkContentToItemAPI = useCallback(async(param: LinkContentToItemParam) => {
        await dispatch(linkContentToItem(param));
    }, [dispatch]);

    const getSnsPreviewAPI = useCallback(async(url: string) => {
        const res = await getAPICallerInstance().callApi(GetSnsPreviewAPI, {
            url,
        });
        return res;
    }, []);

    const getUnpointDataAPI = useCallback(async(dataSourceId: string, nextToken?: string) => {
        const result = await getAPICallerInstance().callApi(GetUnpointDataAPI, {
            dataSourceId,
            nextToken,
        });
        return {
            contents: result.contents as UnpointContent[],
            nextToken: result.nextToken,
        };

    }, []);

    /**
     * 指定のコンテンツのサムネイル画像（Blob）を取得する
     */
    const getThumbnail = useCallback(async(contentId: DataId) => {
        const imgData = await getAPICallerInstance().callApi(GetThumbAPI, {
            id: contentId.id,
        });
        return URL.createObjectURL(imgData);
    }, []);

    const changeVisibleLayer = useCallback((target: { dataSourceId: string } | { group: string }, visible: boolean) => {
        const map = getMapInstance();
        map?.changeVisibleLayer(target, visible);
    }, []);

    return {
        switchMapKind,
        focusItem,
        confirm,
        drawStructure,
        moveStructure,
        changeStructure,
        removeStructure,
        drawTopography,
        drawRoad,
        editTopography,
        removeTopography,
        editTopographyInfo,
        loadContentsAPI,
        showDetailDialog,
        registContentAPI,
        updateContentAPI,
        linkContentToItemAPI,
        getSnsPreviewAPI,
        getUnpointDataAPI,
        getThumbnail,
        changeVisibleLayer,
    }
}
export type CommandHookType = ReturnType<typeof useCommand>;
