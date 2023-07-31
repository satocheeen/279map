import React, { useImperativeHandle, useContext, useRef } from 'react';
import { addListener, doCommand, removeListener } from '../../util/Commander';
import MapChart from './MapChart';
import { OwnerContext } from './TsunaguMap';
import { TsunaguMapHandler } from '../../types/types';
import { GetSnsPreviewAPI, GetThumbAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam, UpdateContentParam, GetContentsParam, RegistContentAPI, UpdateContentAPI, LinkContentToItemAPI } from "tsunagumap-api";
import { useMounted } from '../../util/useMounted';
import { Auth, ContentsDefine, DataId, FeatureType, MapKind, UnpointContent } from '279map-common';
import { useWatch } from '../../util/useWatch';
import { useMap } from '../map/useMap';
import useDataSource from '../../store/datasource/useDataSource';
import { useSubscribe } from '../../util/useSubscribe';
import { useItem } from '../../store/item/useItem';
import { useRecoilValue, useRecoilState } from 'recoil';
import { mapKindState, selectedItemIdsState } from '../../store/operation/operationAtom';
import { dataSourceGroupsState } from '../../store/datasource';
import { connectStatusState, currentMapKindState } from '../../store/session';

type Props = {};

/**
 * 地図コンポーネント。
 * storeはここから有効になる。
 * @returns 
 */
function MapWrapper(props: Props, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const ownerContext = useContext(OwnerContext);
    const connectStatus = useRecoilValue(connectStatusState);
    const currentMapKind = useRecoilValue(currentMapKindState);
    const currentDataSourceGroups = useRecoilValue(dataSourceGroupsState);

    const onConnectRef = useRef<typeof ownerContext.onConnect>();

    const { getApi, getMap } = useMap();
    const { updateDatasourceVisible } = useDataSource();

    useImperativeHandle(ref, () => ({
        switchMapKind(mapKind: MapKind) {
            doCommand({
                command: 'ChangeMapKind',
                param: mapKind,
            });
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
            if (connectStatus.mapDefine.authLv !== Auth.Admin) {
                console.warn('no authorization');
                return;
            }
            doCommand({
                command: 'ShowUserList',
                param: undefined,
            });
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


    /**
     * load map define when mapkind has changed.
     */
    const [ mapKind, setMapKind ] = useRecoilState(mapKindState);
    useMounted(() => {
        const h = addListener('ChangeMapKind', async(mk: MapKind) => {
            if (mk === mapKind) {
                return;
            }
            setMapKind(mk);
        });

        return () => {
            removeListener(h);
        }
    })

    const { removeItems } = useItem();
    const { subscribe, unsubscribe } = useSubscribe();
    useWatch(() => {
        if (!currentMapKind) return;

        subscribe('mapitem-update', () => {
            doCommand({
                command: "LoadLatestData",
                param: undefined,
            });
        });
        subscribe('mapitem-delete', (payload) => {
            if (payload.type === 'mapitem-delete')
                // アイテム削除
                removeItems(payload.itemPageIdList);
        })

        return () => {
            unsubscribe('mapitem-update');
            unsubscribe('mapitem-delete');
        }
    }, [currentMapKind]);

    /**
     * レイヤの表示・非表示切り替え
     */
    useWatch(() => {
        getMap()?.updateLayerVisible(currentDataSourceGroups);

    }, [currentDataSourceGroups]);

    /**
     * 1アイテムが選択されたら詳細ダイアログ表示
     */
    const selectedItemIds = useRecoilValue(selectedItemIdsState);
    const { disabledContentDialog } = useContext(OwnerContext);
    useWatch(() => {
        if (selectedItemIds.length === 1 && !disabledContentDialog) {
            doCommand({
                command: 'ShowItemInfo',
                param: selectedItemIds[0],
            });
        }
    }, [selectedItemIds]);

    return (
        <MapChart />
    );
}

export default React.forwardRef(MapWrapper);
