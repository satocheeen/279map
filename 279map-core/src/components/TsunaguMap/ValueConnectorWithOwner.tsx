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
import { CategoryDefine, DataId, DataSourceGroup, EventDefine, MapKind } from '279map-common';
import { MapMode } from '../../entry';

/**
 * OwnerContextとRecoilを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 * - Recoilの各値の変更検知して呼び出し元に返す
 */
export default function ValueConnectorWithOwner() {
    return (
        <>
            <Suspense>
                <FilterListner />
            </Suspense>
            <ConnectListener />
            <MapLoadListener />
            <DataSourceChangeListener />
            <CategoryLoadListener />
            <EventLoadListener />
            <MapModeChangeListener />
            <SelectChangeLister />
            <RecoilSetter/>
        </>
    )
}

/**
 * OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 */
function RecoilSetter() {
    const { iconDefine } = useContext(OwnerContext);
    const setDefaultIconDefine = useSetRecoilState(defaultIconDefineState);

    useEffect(() => {
        if (iconDefine)
            setDefaultIconDefine(iconDefine);

    }, [iconDefine, setDefaultIconDefine]);

    return null;
}

function FilterListner() {
    const { filter } = useContext(OwnerContext);

    // 検索
    const setFilteredItem = useSetRecoilState(filteredItemsState);
    const { getApi } = useMap();
    const visibleDataSourceIds = useRecoilValue(visibleDataSourceIdsState);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    useWatch(() => {
        const conditions = filter?.conditions;
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

    }, [filter])

    
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

/**
 * カテゴリロード時に呼び出し元にイベント発火する
 */
function CategoryLoadListener() {
    const { onCategoriesLoaded}  = useContext(OwnerContext);
    const categoriesLoadable = useRecoilValueLoadable(categoryState);
    const latestCategories = useRef<CategoryDefine[]>();

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (categoriesLoadable.state !== 'hasValue') return;

        if (JSON.stringify(categoriesLoadable.contents) !== JSON.stringify(latestCategories.current)) {
            if (onCategoriesLoaded) {
                onCategoriesLoaded(categoriesLoadable.contents);
            }
            latestCategories.current = categoriesLoadable.contents;
        }
    });

    return null;
}

/**
 * イベントロード時に呼び出し元にイベント発火する
 */
function EventLoadListener() {
    const { onEventsLoaded }  = useContext(OwnerContext);
    const eventLoadable = useRecoilValueLoadable(eventState);
    const latestEvents = useRef<EventDefine[]>();

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if (eventLoadable.state !== 'hasValue') return;

        if (JSON.stringify(eventLoadable.contents) !== JSON.stringify(latestEvents.current)) {
            if (onEventsLoaded) {
                onEventsLoaded(eventLoadable.contents);
            }
            latestEvents.current = eventLoadable.contents;
        }
    });

    return null;
}

/**
 * 地図モードが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function MapModeChangeListener() {
    const { onModeChanged}  = useContext(OwnerContext);
    const mapMode = useRecoilValue(mapModeState);
    const latestMapModeRef = useRef<MapMode>();

     // マウント後でないとイベント発火できないので、useEffect内で処理
     useEffect(() => {
        if(mapMode !== latestMapModeRef.current) {
            if (onModeChanged) {
                onModeChanged(mapMode);
            }
            latestMapModeRef.current = mapMode;
        }
    })

    return null;
}

/**
 * 選択アイテムが変化した場合に呼び出し元にイベント発火する
 * @returns 
 */
function SelectChangeLister() {
    const { onSelect}  = useContext(OwnerContext);
    const selectedItemIds = useRecoilValue(selectedItemIdsState);
    const latestItemIdsRef = useRef<DataId[]>();

    // マウント後でないとイベント発火できないので、useEffect内で処理
    useEffect(() => {
        if (JSON.stringify(selectedItemIds) !== JSON.stringify(latestItemIdsRef.current)) {
            if (onSelect) {
                onSelect(selectedItemIds);
            }
            latestItemIdsRef.current = selectedItemIds;
        }
    });

    return null;
}