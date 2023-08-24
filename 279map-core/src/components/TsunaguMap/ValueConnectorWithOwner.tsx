import React, { useRef, useContext } from 'react';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue } from 'recoil';
import { OwnerContext } from './TsunaguMap';
import { categoryState } from '../../store/category';
import { eventState } from '../../store/event';
import { useSetRecoilState } from 'recoil';
import { defaultIconDefineState } from '../../store/icon';
import { mapModeState, selectedItemIdsState } from '../../store/operation';
import { dataSourceGroupsState, visibleDataSourceIdsState } from '../../store/datasource';
import { connectStatusState, currentMapKindState } from '../../store/session';
import { filteredItemsState } from '../../store/filter';
import { useMap } from '../map/useMap';
import { SearchAPI } from 'tsunagumap-api';
import { useProcessMessage } from '../common/spinner/useProcessMessage';
import { DataSourceGroup } from '279map-common';

/**
 * OwnerContextとRecoilを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 * - Recoilの各値の変更検知して呼び出し元に返す
 */
export default function ValueConnectorWithOwner() {
    return (
        <>
            <SubValueConnectorWithOwner />
            <DataSourceChangeListener />
        </>
    )
}

function SubValueConnectorWithOwner() {

    const ownerContext = useContext(OwnerContext);

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const setDefaultIconDefine = useSetRecoilState(defaultIconDefineState);

    useWatch(() => {
        if (ownerContext.iconDefine)
            setDefaultIconDefine(ownerContext.iconDefine);

        onConnectRef.current = ownerContext.onConnect;
        onMapKindChangedRef.current = ownerContext.onMapLoad;
        onModeChangedRef.current = ownerContext.onModeChanged;
        onSelectRef.current = ownerContext.onSelect;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    // 検索
    const setFilteredItem = useSetRecoilState(filteredItemsState);
    const { getApi } = useMap();
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    useWatch(() => {
        const conditions = ownerContext.filter?.conditions;
        if (!conditions) {
            setFilteredItem(null);
            return;
        };

        const h = showProcessMessage({
            overlay: true,
            spinner: true,
        });
        getApi().callApi(SearchAPI, {
            conditions,
            dataSourceIds: visibleDataSourceIds,
        }).then(res => {
            setFilteredItem(res.items);
        }).finally(() => {
            hideProcessMessage(h);
        });

    }, [ownerContext.filter])

    const connetStatus = useRecoilValue(connectStatusState);
    useWatch(() => {
        if (onConnectRef.current) {
            onConnectRef.current({
                mapDefine: connetStatus.mapDefine,
            })
        }
    }, [connetStatus]);

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

/**
 * Datasource定義、表示状態が変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function DataSourceChangeListener() {
    const ownerContext = useContext(OwnerContext);
    const currentDataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const latestDataSourceGroupsRef = useRef<DataSourceGroup[]>();

    if (JSON.stringify(latestDataSourceGroupsRef.current) !== JSON.stringify(currentDataSourceGroups)) {
        console.log('DataSourceChange');
        if (ownerContext.onDatasourceChanged) {
            ownerContext.onDatasourceChanged({
                dataSourceGroups: currentDataSourceGroups,
            })
            latestDataSourceGroupsRef.current = currentDataSourceGroups;
        }
    }

    return null;
}