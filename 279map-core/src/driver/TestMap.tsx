import { ConnectResult } from 'tsunagumap-api';
import { CategoryDefine, FeatureType, MapKind } from '279map-common';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CommandHookType } from '../api/useCommand';
import TsunaguMap, { TsunaguMapProps } from '../components/TsunaguMap/TsunaguMap';
import { FilterDefine } from '../entry';
import { ConnectedMap } from '../store/session/sessionSlice';
import styles from './TestMap.module.scss';

/**
 * for Development
 */
const props = {
    mapServerHost: 'localhost',
    mapId: 'testmap',
    auth: 'hogehoge',
    iconDefine: [
        {
            id: 'default',
            useMaps: [MapKind.Real],
        },
        {
            id: 'house',
            imagePath: './icon/house.png',
            useMaps: [MapKind.Virtual],
        }
    ]
} as TsunaguMapProps;

export default function TestMap() {
    const [ cnt, setCnt ] = useState(0);
    const [ categories, setCategories ] = useState<CategoryDefine[]>([]);
    const [ commandHook, setCommandHook ] = useState<CommandHookType>();
    const onConnect = useCallback((mapDefine: ConnectedMap, commandHook: CommandHookType) => {
        console.log('connect', mapDefine);
        setMapKind(mapDefine.defaultMapKind);
        setCommandHook(commandHook);
        setCnt(cnt + 1);
    }, [cnt]);

    const onCategoriesLoaded = useCallback((categories: CategoryDefine[]) => {
        setCategories(categories);
    }, []);
    const [ filteredCategory, setFilteredCategory ] = useState<string| undefined>();
    const onChangeFilterCategory = useCallback((category: string | undefined) => {
        setFilteredCategory(category);
    }, []);
    const filter = useMemo((): FilterDefine[] => {
        if (filteredCategory === undefined) {
            return [];
        }
        return [
            {
                type: 'category',
                categoryName: filteredCategory,
            }
        ];

    }, [filteredCategory]);

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ disabledPopup, setDisablePopup ] = useState(false);

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ disabledContentDialog, setDisableContentDialog ] = useState(false);

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
        commandHook?.focusItem(focusItemId);
    }, [commandHook, focusItemId]);

    const [token, setToken] = useState<string|undefined>();
    useEffect(() => {
        setTimeout(() => {
            console.log('setToken');
            // setToken('hogehoge');
            setToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE2S0hnVFRPMWZqRThXX1hqZWNoTyJ9.eyJpc3MiOiJodHRwczovL2Rldi1nbjVhdzhqaXVscThxcmJ6LmpwLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2M2M4ZmMxODMyOTA1NTA4YjMzNTM3MDMiLCJhdWQiOlsiaHR0cHM6Ly8yNzltYXAuc2F0b2NoZWVlbi9hcGkiLCJodHRwczovL2Rldi1nbjVhdzhqaXVscThxcmJ6LmpwLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2NzU0OTg4OTUsImV4cCI6MTY3NTU4NTI5NSwiYXpwIjoiUmxXblR3OGhXV0ZQWjdCZDBnYTl0VmRhQm13SFQ1UXgiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIn0.th5qDoBt2M99XWWJJP1JNXKC4ZhsJEp1HOL5TuAo99vx5x7YZyFFnB6nu-3_wiIyfU95fckhkXijVRdkIYKjJmmP4bcTw_ERczrZCU9P7xCVeZ5rYaGHQDUQFSwNXJYsUuSpFjVzYQgf6qLzFr8Eyy9BFJicRzsTvtW5jUpi276A41XF8dglxV4Ol8dUxgiHAX5-pveH6dD_lfO8apVDcXuTgjMz-SaK5tZOvmjao1YTucl6LFA9Snvs-InIPJxyJRwyhpZH_3BwuSzrPdIAQH4MllLK736Ah3fwCXF8u90I_kAlcfojLBpB-RV-bWbhDDT3-q_4QlnTsrK6GEQ_QQ');
        }, 10);
    }, []);

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    <button onClick={commandHook?.login}>Login</button>
                    <button onClick={commandHook?.logout}>Logout</button>
                </div>
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
                <PropRadio name='disabledContentDialog' value={disabledContentDialog} onChange={setDisableContentDialog} />
                <div className={styles.Col}>
                    <h3>カテゴリフィルタ</h3>
                    <div>
                        <label>
                            なし
                            <input type="radio" checked={filteredCategory===undefined} onChange={() => onChangeFilterCategory(undefined)} />
                        </label>
                        {categories.map(category => {
                            return (
                                <label key={category.name}>
                                    {category.name}
                                    <input type="radio" checked={filteredCategory===category.name} onChange={() => onChangeFilterCategory(category.name)} />
                                </label>
                            )
                        })}
                    </div>
                </div>
                <div className={styles.Col}>
                    <button onClick={commandHook?.drawStructure}>建設</button>
                    <button onClick={commandHook?.moveStructure}>移築</button>
                    <button onClick={commandHook?.changeStructure}>改築</button>
                    <button onClick={commandHook?.removeStructure}>建物解体</button>
                </div>
                <div className={styles.Col}>
                    {mapKind === MapKind.Real ?
                        <>
                            <button onClick={()=>commandHook?.drawTopography(FeatureType.AREA)}>エリア作成</button>
                            <button onClick={commandHook?.editTopography}>エリア編集</button>
                            <button onClick={commandHook?.removeTopography}>エリア削除</button>
                        </>
                        :
                        <>
                            <button onClick={()=>commandHook?.drawTopography(FeatureType.EARTH)}>島作成</button>
                            <button onClick={()=>commandHook?.drawTopography(FeatureType.FOREST)}>緑地作成</button>
                            <button onClick={commandHook?.drawRoad}>道作成</button>
                            <button onClick={commandHook?.editTopography}>地形編集</button>
                            <button onClick={commandHook?.removeTopography}>地形削除</button>
                            <button onClick={commandHook?.editTopographyInfo}>地名編集</button>
                        </>
                    }
                </div>
                <div className={styles.Col}>
                    <button onClick={callGetSnsPreview}>GetSNS</button>
                    <button onClick={confirm}>Confirm</button>
                </div>

                <div className={styles.Col}>
                    <input type='text' value={focusItemId} onChange={onChangeFocusItemId} />
                    <button onClick={onFocusItem}>Focus Item</button>
                </div>
            </div>
            <div className={styles.Map}>
                {token &&
                    <TsunaguMap {...props}
                    token={token}
                    disabledPopup={disabledPopup}
                    disabledLabel={disabledLabel}
                    disabledContentDialog={disabledContentDialog}
                    filter={filter}
                    onConnect={onConnect}
                    onMapKindChanged={onMapKindChanged}
                    onSelect={onSelect} onUnselect={onUnselect}
                    onModeChanged={(val) => onCallback('onModeChanged', val)}
                    onCategoriesLoaded={onCategoriesLoaded}
                    onNewContentInfo={(val) => onCallback('onNewContentInfo', val)}
                    onEditContentInfo={(val) => onCallback('onEditContentInfo', val)}
                    />
                }
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