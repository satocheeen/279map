import React, { useRef, useContext } from 'react';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { OwnerContext } from './TsunaguMap';
import { categoryState } from '../../store/category';
import { eventState } from '../../store/event';
import { useSetRecoilState } from 'recoil';
import { defaultIconDefineState } from '../../store/icon';
import { filteredItemsState, mapModeState, selectedItemIdsState } from '../../store/operation/operationAtom';
import { dataSourceGroupsState } from '../../store/datasource';
import { currentMapKindState, instanceIdState, mapDefineState, mapIdState, mapServerState } from '../../store/map';
import { contentsState, itemMapState } from '../../store/data/dataAtom';

/**
 * OwnerContextとRecoilを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 * - Recoilの各値の変更検知して呼び出し元に返す
 */
export default function ValueConnectorWithOwner() {
    const ownerContext = useContext(OwnerContext);

    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onDatasourceChangedRef = useRef<typeof ownerContext.onDatasourceChanged>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const setInstanceId = useSetRecoilState(instanceIdState);
    const setMapId = useSetRecoilState(mapIdState);
    const setMapServer = useSetRecoilState(mapServerState);
    const setDefaultIconDefine = useSetRecoilState(defaultIconDefineState);

    useWatch(() => {
        setInstanceId(ownerContext.mapInstanceId);
        setMapId(ownerContext.mapId);
        setMapServer(ownerContext.mapServer);
        if (ownerContext.iconDefine)
            setDefaultIconDefine(ownerContext.iconDefine);

        onMapKindChangedRef.current = ownerContext.onMapLoad;
        onModeChangedRef.current = ownerContext.onModeChanged;
        onSelectRef.current = ownerContext.onSelect;
        onDatasourceChangedRef.current = ownerContext.onDatasourceChanged;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    // TODO: 仮。DataSourceのVisibleを別管理に変更するまでの暫定。
    const mapDefine = useRecoilValue(mapDefineState);
    const setDataSourceGroups = useSetRecoilState(dataSourceGroupsState);
    const resetItemMap = useResetRecoilState(itemMapState);
    const resetContents = useResetRecoilState(contentsState);
    const resetFilteredItems = useResetRecoilState(filteredItemsState);
    useWatch(() => {
        if (mapDefine)
            setDataSourceGroups(mapDefine.dataSourceGroups);

        resetItemMap();
        resetContents();
        resetFilteredItems();
    }, [mapDefine])

    const currentMapKind = useRecoilValue(currentMapKindState);
    useWatch(() => {
        if (onMapKindChangedRef.current && currentMapKind) {
            onMapKindChangedRef.current({
                mapKind: currentMapKind,
            });
        }

    }, [currentMapKind]);
    
    /**
     * callback when map mode has changed.
     */
    const mapMode = useRecoilValue(mapModeState);
    useWatch(() => {
        if (onModeChangedRef.current) {
            onModeChangedRef.current(mapMode);
        }
    }, [mapMode]);

    /**
     * 選択アイテムが変更されたらコールバック
     */
    const selectedItemIds = useRecoilValue(selectedItemIdsState);
    useWatch(() => {
        if (onSelectRef.current) {
            onSelectRef.current(selectedItemIds);
        }
    }, [selectedItemIds]);
    
    const currentDataSourceGroups = useRecoilValue(dataSourceGroupsState);
    useWatch(() => {
        if (onDatasourceChangedRef.current) {
            onDatasourceChangedRef.current({
                dataSourceGroups: currentDataSourceGroups,
            })
        }
    }, [currentDataSourceGroups]);

    /**
     * callback when categories has loaded or changed.
     */
    const categories = useRecoilValue(categoryState);
    useWatch(() => {
        if (onCategoriesLoadedRef.current) {
            onCategoriesLoadedRef.current(categories);
        }
    }, [categories]);

    /**
     * callback when events has loaded or changed.
     */
    const events = useRecoilValue(eventState);
    useWatch(() => {
        if(onEventsLoadedRef.current) {
            onEventsLoadedRef.current(events);
        }
    }, [events]);

    return null;
}