import React, { useImperativeHandle, useContext, useRef, useState, useCallback } from 'react';
import { addListener, doCommand, removeListener } from '../../util/Commander';
import MapChart from './MapChart';
import { OwnerContext } from './TsunaguMap';
import { TsunaguMapHandler } from '../../types/types';
import { GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam, UpdateContentParam, GetContentsParam, RegistContentAPI, UpdateContentAPI, LinkContentToItemAPI, GetMapInfoAPI } from "tsunagumap-api";
import { useMounted } from '../../util/useMounted';
import { Auth, ContentsDefine, DataId, Extent, FeatureType, MapKind, UnpointContent } from '279map-common';
import { useWatch } from '../../util/useWatch';
import { useMap } from '../map/useMap';
import useDataSource from '../../store/datasource/useDataSource';
import { useSubscribe } from '../../util/useSubscribe';
import { useItem } from '../../store/item/useItem';
import { selectedItemIdsAtom } from '../../store/operation';
import { connectStatusAtom, currentMapKindAtom, mapDefineAtom } from '../../store/session';
import { itemDataSourcesAtom } from '../../store/datasource';
import { useAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { loadedItemKeysAtom } from '../../store/item';
import { checkContaining } from '../../util/MapUtility';
import { useMapController } from '../../store/useMapController';

type Props = {
    onInitialized?: () => void;
};

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
function MapWrapper(props: Props, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const ownerContext = useContext(OwnerContext);
    const [ connectStatus ] = useAtom(connectStatusAtom);
    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);

    const onConnectRef = useRef<typeof ownerContext.onConnect>();

    const { getApi, getMap } = useMap();
    const { updateDatasourceVisible } = useDataSource();

    const showUserList = useCallback(() => {
        if (connectStatus.mapDefine.authLv !== Auth.Admin) {
            console.warn('no authorization', connectStatus.mapDefine.authLv);
            return;
        }
        doCommand({
            command: 'ShowUserList',
            param: undefined,
        });
    }, [connectStatus]);

    useImperativeHandle(ref, () => ({
        switchMapKind(mapKind: MapKind) {
            changeMapKind(mapKind);
        },
        focusItem(itemId: DataId, opts?: {zoom?: boolean}) {
            doCommand({
                command: 'FocusItem',
                param: {
                    itemId,
                    zoom: opts?.zoom,
                }
            });
        },
        drawStructure(dataSourceId: string) {
            doCommand({
                command: 'DrawStructure',
                param: dataSourceId,
            });
        },
        moveStructure() {
            doCommand({
                command: 'MoveStructure',
                param: undefined,
            });
        },
        changeStructure() {
            doCommand({
                command: 'ChangeStructure',
                param: undefined,
            });
        },
        removeStructure() {
            doCommand({
                command: 'RemoveStructure',
                param: undefined,
            });
        },
        drawTopography(dataSourceId: string, featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA) {
            doCommand({
                command: 'DrawTopography',
                param: {
                    dataSourceId, 
                    featureType,
                }
            });
        },
        drawRoad(dataSourceId: string) {
            doCommand({
                command: 'DrawRoad',
                param: dataSourceId,
            });
        },
        editTopography() {
            doCommand({
                command:'EditTopography',
                param: undefined,
            });
        },
        removeTopography() {
            doCommand({
                command:'RemoveTopography',
                param: undefined,
            });
        },
        editTopographyInfo() {
            doCommand({
                command:'EditTopographyInfo',
                param: undefined,
            });
        },
        showUserList() {
            showUserList();
        },
        async loadContentsAPI(param: GetContentsParam): Promise<ContentsDefine[]> {
            try {
                const res = await getApi().getContents(param);
                return res;

            } catch(err) {
                throw new Error('registContentAPI failed.' + err);
            }
        },

        async showDetailDialog(param: {type: 'item' | 'content'; id: DataId}) {
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
        },
        async registContentAPI(param: RegistContentParam) {
            try {
                await getApi().callApi(RegistContentAPI, param);

            } catch(e) {
                throw new Error('registContentAPI failed.' + e);
            }
        },
        async updateContentAPI(param: UpdateContentParam) {
            await getApi().callApi(UpdateContentAPI, param);
        },
        async linkContentToItemAPI(param: LinkContentToItemParam) {
            await getApi().callApi(LinkContentToItemAPI, param);
        },
    
        async getSnsPreviewAPI(url: string) {
            const res = await getApi().callApi(GetSnsPreviewAPI, {
                url,
            });
            return res;
        },
    
        async getUnpointDataAPI(dataSourceId: string, nextToken?: string) {
            const result = await getApi().callApi(GetUnpointDataAPI, {
                dataSourceId,
                nextToken,
            });
            return {
                contents: result.contents as UnpointContent[],
                nextToken: result.nextToken,
            };
    
        },
    
        /**
         * 指定のコンテンツのサムネイル画像（Blob）を取得する
         */
        async getThumbnail(contentId: DataId) {
            const imgData = await getApi().callApi(GetThumbAPI, {
                id: contentId.id,
            });
            return URL.createObjectURL(imgData);
        },
    
        changeVisibleLayer(target: { dataSourceId: string } | { group: string }, visible: boolean) {
            updateDatasourceVisible({
                target,
                visible,
            });
        },
                                                        
    }));

    useWatch(() => {
        onConnectRef.current = ownerContext.onConnect;
    }, [ownerContext]);

    const { removeItems, resetItems } = useItem();

    /**
     * load map define when mapkind has changed.
     */
    const [initialized, setInitialized] = useState(false);

    const { loadMapDefine, changeMapKind } = useMapController();

    useMounted(() => {
        // 初期地図読み込み
        loadMapDefine(connectStatus.mapDefine.defaultMapKind)
        .then(() => {
            setInitialized(true);
            if (props.onInitialized) {
                props.onInitialized();
            }
        })
    })

    const clearLoadedArea = useAtomCallback(
        useCallback((get, set, targets: {datasourceId: string, extent: Extent}[]) => {
            set(loadedItemKeysAtom, (current) => {
                return current.filter(cur => {
                    // ヒットしないもののみを残す
                    return targets.some(target => {
                        if (target.datasourceId !== cur.datasourceId) {
                            return false;
                        }
                        if (checkContaining(target.extent, cur.extent) === 0) {
                            return false;
                        }
                        return true;
                    })
                });
            });

        }, [])
    )
    const { subscribeMap: subscribe, unsubscribeMap: unsubscribe } = useSubscribe();
    useWatch(() => {
        if (!currentMapKind) return;

        subscribe('mapitem-update', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-update') {
                // 指定のエクステントをロード済み対象から除去する
                clearLoadedArea(payload.targets);

                doCommand({
                    command: "LoadLatestData",
                    param: undefined,
                });
            }
        });
        subscribe('mapitem-delete', currentMapKind, undefined, (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        return () => {
            unsubscribe('mapitem-update', currentMapKind, undefined);
            unsubscribe('mapitem-delete', currentMapKind, undefined);
        }
    }, [currentMapKind]);

    /**
     * レイヤの表示・非表示切り替え
     */
    useWatch(() => {
        getMap()?.updateLayerVisible(itemDataSources);

    }, [itemDataSources]);

    /**
     * 1アイテムが選択されたら詳細ダイアログ表示
     */
    const [selectedItemIds] = useAtom(selectedItemIdsAtom);
    const { disabledContentDialog } = useContext(OwnerContext);
    useWatch(() => {
        if (selectedItemIds.length === 1 && !disabledContentDialog) {
            doCommand({
                command: 'ShowItemInfo',
                param: selectedItemIds[0],
            });
        }
    }, [selectedItemIds]);

    if (!initialized) return null;
    return (
        <MapChart />
    );
}

export default React.forwardRef(MapWrapper);
