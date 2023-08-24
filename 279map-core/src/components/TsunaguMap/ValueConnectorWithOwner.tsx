import React, { Suspense, useRef, useContext, useEffect } from 'react';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue, useRecoilValueLoadable } from 'recoil';
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
import { DataSourceGroup, MapKind } from '279map-common';

/**
 * OwnerContextとRecoilを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 * - Recoilの各値の変更検知して呼び出し元に返す
 */
export default function ValueConnectorWithOwner() {
    return (
        <>
            <Suspense>
                <SubValueConnectorWithOwner />
            </Suspense>
            <ConnectListener />
            <MapLoadListener />
            <DataSourceChangeListener />
        </>
    )
}

function SubValueConnectorWithOwner() {

    const ownerContext = useContext(OwnerContext);

    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();
    const onEventsLoadedRef = useRef<typeof ownerContext.onEventsLoaded>();

    const setDefaultIconDefine = useSetRecoilState(defaultIconDefineState);

    useWatch(() => {
        if (ownerContext.iconDefine)
            setDefaultIconDefine(ownerContext.iconDefine);

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
 * connect時に呼び出し元にイベント発火する
 */
function ConnectListener() {
    const { onConnect } = useContext(OwnerContext);
    const connectLoadable = useRecoilValueLoadable(connectStatusState);
    const connectedRef = useRef(false);

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (!connectedRef.current && connectLoadable.state === 'hasValue') {
            connectedRef.current = true;
            if (onConnect) {
                onConnect({
                    mapDefine: connectLoadable.contents.mapDefine,
                })
            }
        }
    });

    return null;
}

/**
 * 地図ロード時に呼び出し元にイベント発火する
 */
function MapLoadListener() {
    const { onMapLoad } = useContext(OwnerContext);
    const currentMapKindLoadable = useRecoilValueLoadable(currentMapKindState);
    const latestMapKindRef = useRef<MapKind>();

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (currentMapKindLoadable.state === 'hasValue' && currentMapKindLoadable.contents && latestMapKindRef.current !== currentMapKindLoadable.contents) {
            latestMapKindRef.current = currentMapKindLoadable.contents;
            if (onMapLoad) {
                onMapLoad({
                    mapKind: currentMapKindLoadable.contents,
                })
            }
        }
    });

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

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (JSON.stringify(latestDataSourceGroupsRef.current) !== JSON.stringify(currentDataSourceGroups)) {
            console.log('DataSourceChange');
            if (ownerContext.onDatasourceChanged) {
                ownerContext.onDatasourceChanged({
                    dataSourceGroups: currentDataSourceGroups,
                })
                latestDataSourceGroupsRef.current = currentDataSourceGroups;
            }
        }
     })

    return null;
}