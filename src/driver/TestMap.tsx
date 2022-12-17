import { api, MapKind } from '279map-common';
import React, { useState, useCallback } from 'react';
import { CommandHookType } from '../api/useCommand';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import { FilterDefine } from '../entry';
import { doCommand } from '../util/Commander';
import styles from './TestMap.module.scss';

/**
 * for Development
 */
const props = {
    mapServerHost: '279map.satocheeen.com',
    mapId: 'test',
    auth: 'hogehoge',        
};

export default function TestMap() {
    const [ cnt, setCnt ] = useState(0);
    const [ commandHook, setCommandHook ] = useState<CommandHookType>();
    const onConnect = useCallback((mapDefine: api.ConnectResult, commandHook: CommandHookType) => {
        console.log('connect', mapDefine);
        setMapKind(mapDefine.defaultMapKind);
        setCommandHook(commandHook);
        setCnt(cnt + 1);
    }, [cnt]);

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ disabledPopup, setDisablePopup ] = useState(false);

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ filter, setFilter ] = useState<FilterDefine[]>([]);

    const onMapKindChanged = useCallback((mapKind: MapKind) => {
        setMapKind(mapKind);
    }, []);
    const switchMapKind = useCallback((mapKind: MapKind) => {
        commandHook?.switchMapKind(mapKind);
    }, [commandHook]);

    // callbacks
    const onSelect = useCallback((ids: string[]) => {
        console.log('onSelect', ids, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

    const onUnselect = useCallback(() => {
        console.log('onUnselect');
    }, []);

    const onCallback = useCallback((msg: string, param: any) => {
        console.log(msg, param);
    }, []);

    const callGetSnsPreview = useCallback(async() => {
        if(!commandHook) return;
        const result = await commandHook.getSnsPreviewAPI('https://www.instagram.com/umihiko.miya/');
        console.log('result', result);
    }, [commandHook]);

    const createStructure = useCallback(() => {
        doCommand({
            command: 'DrawStructure',
            param: undefined,
        });
    }, []);

    const onFilter = useCallback(() => {
        setFilter([
            {
                type: 'category',
                categoryName: 'AAA',
            }
        ]);
    }, []);

    const clearFilter = useCallback(() => {
        setFilter([]);
    }, []);

    const confirm = useCallback(async() => {
        const result = await commandHook?.confirm({
            message: '確認ためし',
            title: '確認',
        });
        console.log('confirm result', result);
    }, [commandHook]);

    const [ focusItemId, setFocusItemId ] = useState('');
    const onChangeFocusItemId = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setFocusItemId(event.target.value);
    }, []);
    const onFocusItem = useCallback(() => {
        commandHook?.focueItem(focusItemId);
    }, [commandHook, focusItemId]);

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    <h3>地図種別</h3>
                    <label>
                        日本地図
                        <input type="radio" checked={mapKind===MapKind.Real} onChange={() => switchMapKind(MapKind.Real)} />
                    </label>
                    <label>
                        村マップ
                        <input type="radio" checked={mapKind===MapKind.Virtual} onChange={() => switchMapKind(MapKind.Virtual)} />
                    </label>
                </div>
                <PropRadio name='disabledPopup' value={disabledPopup} onChange={setDisablePopup} />
                <PropRadio name='disabledLabel' value={disabledLabel} onChange={setDisableLabel} />
                <button onClick={createStructure}>建設</button>
                <button onClick={callGetSnsPreview}>GetSNS</button>
                <button onClick={confirm}>Confirm</button>
                <button onClick={onFilter}>Filter</button>
                <button onClick={clearFilter}>Filter Clear</button>

                <div className={styles.Col}>
                    <input type='text' value={focusItemId} onChange={onChangeFocusItemId} />
                    <button onClick={onFocusItem}>Focus Item</button>
                </div>
            </div>
            <div className={styles.Map}>
                <TsunaguMap {...props}
                    disabledPopup={disabledPopup}
                    disabledLabel={disabledLabel}
                    filter={filter}
                    onConnect={onConnect}
                    onMapKindChanged={onMapKindChanged}
                    onSelect={onSelect} onUnselect={onUnselect}
                    onModeChanged={(val) => onCallback('onModeChanged', val)}
                    onCategoriesLoaded={(val)=>onCallback('onCategoriesLoaded', val)} />
            </div>
        </>
    );
}

type PropRadioProps = {
    name: string;
    value: boolean;
    onChange: (val: boolean) => void;
}
function PropRadio(props: PropRadioProps) {
    return (
        <div className={styles.Col}>
            <h3>{props.name}</h3>
            <label>
                <input type="radio" checked={!props.value} onChange={() => props.onChange(false)} />
                false
            </label>
            <label>
                <input type="radio" checked={props.value} onChange={() => props.onChange(true)} />
                true
            </label>
        </div>
    )
}