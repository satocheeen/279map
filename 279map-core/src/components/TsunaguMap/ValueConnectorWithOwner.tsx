import React, { useRef, useContext } from 'react';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { OwnerContext } from './TsunaguMap';
import { categoryState } from '../../store/category';
import { eventState } from '../../store/event';
import { useSetRecoilState } from 'recoil';
import { defaultIconDefineState } from '../../store/icon';
import { mapModeState, selectedItemIdsState } from '../../store/operation/operationAtom';
import { dataSourceGroupsState } from '../../store/datasource';
import { connectStatusState, currentMapKindState, mapDefineState } from '../../store/session';
import { itemMapState } from '../../store/item';
import { filterConditionState } from '../../store/filter';

/**
 * OwnerContextとRecoilを繋ぐコンポーネントもどき
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する
 * - Recoilの各値の変更検知して呼び出し元に返す
 */
export default function ValueConnectorWithOwner() {
    const ownerContext = useContext(OwnerContext);

    const onConnectRef = useRef<typeof ownerContext.onConnect>();
    const onMapKindChangedRef = useRef<typeof ownerContext.onMapLoad>();
    const onModeChangedRef = useRef<typeof ownerContext.onModeChanged>();
    const onSelectRef = useRef<typeof ownerContext.onSelect>();
    const onDatasourceChangedRef = useRef<typeof ownerContext.onDatasourceChanged>();
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
        onDatasourceChangedRef.current = ownerContext.onDatasourceChanged;
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
        onEventsLoadedRef.current = ownerContext.onEventsLoaded;
    }, [ownerContext]);

    const setFilterCondition = useSetRecoilState(filterConditionState);
    useWatch(() => {
        setFilterCondition(ownerContext.filter?.conditions);
    }, [ownerContext.filter])

    // TODO: 仮置き場
    const mapDefine = useRecoilValue(mapDefineState);
    const resetItemMap = useResetRecoilState(itemMapState);
    useWatch(() => {
        resetItemMap();
    }, [mapDefine])

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