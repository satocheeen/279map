import { useCallback } from "react";
import { useMap } from "../../components/map/useMap";
import { ConnectAPI, ErrorType, GetMapInfoAPI } from "tsunagumap-api";
import { MapKind } from "279map-common";
import { useResetRecoilState, useSetRecoilState } from "recoil";
import { categoryState, contentsState, dataSourceGroupsState, eventsState, itemMapState } from "./dataAtom";
import { connectStatusState, currentMapKindInfoState } from "../session/sessionAtom";
import { filteredItemsState } from "../operation/operationAtom";
import { OwnerContext } from "../../components/TsunaguMap/TsunaguMap";
import { useContext } from 'react';
import { createMqttClientInstance } from "../session/MqttInstanceManager";
import { ApiException } from "../../api";

export function useMapDefine() {
    const { getApi } = useMap();
    const setDataSourceGroups = useSetRecoilState(dataSourceGroupsState);
    const setCurrentMapKindInfo = useSetRecoilState(currentMapKindInfoState);

    const resetItemMap = useResetRecoilState(itemMapState);
    const resetContents = useResetRecoilState(contentsState);
    const resetCategory = useResetRecoilState(categoryState);
    const resetEvents = useResetRecoilState(eventsState);
    const resetFilteredItems = useResetRecoilState(filteredItemsState);
    const { mapServer } = useContext(OwnerContext);
    const setConnectStatus = useSetRecoilState(connectStatusState);

    const connectMap = useCallback(async(param: {instanceId: string; mapId: string}) => {
        try {
            const json = await getApi().callApi(ConnectAPI, {
                mapId: param.mapId,
            });

            getApi().setSID(json.sid);

            createMqttClientInstance(param.instanceId, mapServer.host, json.sid);

            console.log('debug2');
            setConnectStatus({
                status: 'connected',
                connectedMap: json.mapDefine,
                sid: json.sid,
            })

            return json;

        } catch(e) {
            console.warn('connect error', e);

            if (e instanceof ApiException) {
                console.log('debug3');
                setConnectStatus({
                    status: 'failure',
                    error: e.apiError,
                })
            } else {
                console.log('debug4');
                setConnectStatus({
                    status: 'failure',
                    error: {
                        type: ErrorType.IllegalError,
                        detail: e + '',
                    }
                })
            }
            throw e;
        }

    }, [getApi, mapServer, setConnectStatus]);

    /**
     * 地図定義ロード
     * @param mapKind ロードする地図種別
     */
    const loadMapDefine = useCallback(async(mapKind: MapKind) => {
        console.log('loadMapDefine');

        try {
            if (mapServer.host.length === 0) {
                throw 'no set mapserver';
            }
    
            const apiResult = await getApi().callApi(GetMapInfoAPI, {
                mapKind,
            });
            setDataSourceGroups(apiResult.dataSourceGroups);
            setCurrentMapKindInfo({
                mapKind: apiResult.mapKind,
                extent: apiResult.extent,
            });

            resetItemMap();
            resetContents();
            resetCategory();
            resetEvents();
            resetFilteredItems();

        } catch(e) {
            console.warn('getMapInfo error', e);
            throw e;
        }

    }, [mapServer, getApi, resetCategory, resetContents, resetEvents, resetFilteredItems, resetItemMap, setCurrentMapKindInfo, setDataSourceGroups]);

    return {
        connectMap,
        loadMapDefine,
    }
}