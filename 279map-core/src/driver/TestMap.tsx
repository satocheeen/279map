import { Auth, CategoryDefine, DataId, DataSourceGroup, DataSourceKindType, FeatureType, MapKind } from '279map-common';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CommandHookType, ServerInfo, onDatasourceChangedParam } from '../entry';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import { FilterDefine, OnConnectParam, OnMapLoadParam, TsunaguMapProps } from '../entry';
import styles from './TestMap.module.scss';
import FilterCondition from './FilterCondition';

/**
 * for Development
 */
const mapId = 'test';
const myToken = 'hogehoge';//undefined;
const myMapServer = {
    host: 'localhost',
    ssl: false,
};

const props = {
    mapId,
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
    const [ authLv, setAuthLv ] = useState(Auth.None);
    const onConnect = useCallback((param: OnConnectParam) => {
        console.log('connect', param);
        if (param.result === 'success') {
            setMapKind(param.mapDefine.defaultMapKind);
            setCommandHook(param.commandHook);
            setAuthLv(param.mapDefine.authLv);
        }
        setCnt(cnt + 1);
    }, [cnt]);

    const onCategoriesLoaded = useCallback((categories: CategoryDefine[]) => {
        setCategories(categories);
    }, []);

    const [ filterConditions, setFilterConditions ] = useState<FilterDefine[]|undefined>();
    const [ filterUnmatchView, setFilterUnmatchView ] = useState<'hidden'|'translucent'>('hidden');
    const filter = useMemo((): TsunaguMapProps['filter'] => {
        if (!filterConditions) return;
        return {
            conditions: filterConditions,
            unmatchView: filterUnmatchView,
        }
    }, [filterConditions, filterUnmatchView]);

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ popupMode, setPopupMode ] = useState<TsunaguMapProps['popupMode']>('minimum');

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ disabledContentDialog, setDisableContentDialog ] = useState(false);

    const [ dataSourceGroups, setDataSourceGroups] = useState<DataSourceGroup[]>([]);

    const featureDataSourceGroups = useMemo(() => {
        return dataSourceGroups.map((group): DataSourceGroup => {
            const dataSources = group.dataSources.filter(ds => {
                const isFeature = ds.kind !== DataSourceKindType.Content;
                return isFeature;
            });
            return {
                group: group.group,
                dataSources,
            }
        });
    }, [dataSourceGroups]);

    const onMapLoad = useCallback((param: OnMapLoadParam) => {
        setMapKind(param.mapKind);
    }, []);

    const onDataSourceChanged = useCallback((param: onDatasourceChangedParam) => {
        setDataSourceGroups(param.dataSourceGroups);
    }, []);

    const switchMapKind = useCallback((mapKind: MapKind) => {
        commandHook?.switchMapKind(mapKind);
    }, [commandHook]);

    // callbacks
    const onSelect = useCallback((ids: DataId[]) => {
        console.log('onSelect', ids, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

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
    const [ focusDataSourceId, setFocusDataSourceId ] = useState('');
    const onFocusItem = useCallback(() => {
        commandHook?.focusItem({
            dataSourceId: focusDataSourceId,
            id: focusItemId,
        }, {
            zoom: false,
        });
    }, [commandHook, focusItemId, focusDataSourceId]);

    const [token, setToken] = useState<string|undefined>();
    useEffect(() => {
        if (!myToken) return;
        setTimeout(() => {
            console.log('setToken', myToken);
            setToken(myToken);
        }, 500);
    }, []);

    const mapServer = useMemo((): ServerInfo => {
        return {
            host: myMapServer.host,
            ssl: myMapServer.ssl,
            token,
        }
    }, [token]);

    const getThumbnail = useCallback(async() => {
        if (!commandHook) {
            console.warn('commandHook undefined');
            return;
        }
        const img = await commandHook?.getThumbnail({
            dataSourceId: '8ab78092-80f3-4ed7-82f4-ed5df3e01c1b',
            id: '00c94264-07f5-4d56-adec-7cac9a326c7e',
        });
        console.log('thumb', img);
    }, [commandHook]);

    const changeVisibleLayerDataSource = useCallback((dataSourceId: string, visible: boolean) => {
        commandHook?.changeVisibleLayer({
            dataSourceId,
        }, visible);
    }, [commandHook]);

    const changeVisibleLayerGroup = useCallback((group: string, visible: boolean) => {
        commandHook?.changeVisibleLayer({
            group,
        }, visible);
    }, [commandHook]);

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    <div className={styles.Row}>
                        <div className={styles.PropName}>地図種別</div>
                        <label>
                            日本地図
                            <input type="radio" checked={mapKind===MapKind.Real} onChange={() => switchMapKind(MapKind.Real)} />
                        </label>
                        <label>
                            村マップ
                            <input type="radio" checked={mapKind===MapKind.Virtual} onChange={() => switchMapKind(MapKind.Virtual)} />
                        </label>
                    </div>
                    <PropRadio name='Popup'
                        items={[{ label: 'hidden', value: 'hidden' }, {label: 'minimum', value: 'minimum' }, { label: 'maximum', value: 'maximum' }]}
                        default='maximum'
                        onChange={setPopupMode} />
                    <PropRadio name='Label'
                        items={[{ label: 'enabled', value: true }, { label: 'disabled', value: false }]}
                        onChange={setDisableLabel} />
                    <PropRadio name='ContentDialog'
                        items={[{ label: 'enabled', value: true }, { label: 'disabled', value: false }]}
                        onChange={setDisableContentDialog} />
                </div>
                <div className={styles.Col}>
                    <div className={styles.PropName}>データソース</div>
                    {featureDataSourceGroups.map(group => {
                        return (
                            <>
                                {group.group &&
                                    <label key={group.group}>
                                        <input type="checkbox" defaultChecked={true} onChange={(evt) => changeVisibleLayerGroup(group.group ?? '', evt.target.checked)} />
                                        {group.group}
                                    </label>
                                }
                                {group.dataSources.map(ds => {
                                    return (
                                        <>
                                            <label key={ds.dataSourceId} className={`${group.group ? styles.Child : ''}`}>
                                                <input type="checkbox" defaultChecked={true} onChange={(evt) => changeVisibleLayerDataSource(ds.dataSourceId, evt.target.checked)} />
                                                {ds.name}
                                                {(ds.editable && authLv === Auth.Edit) &&
                                                    <>
                                                        <button onClick={()=>commandHook?.drawStructure(ds.dataSourceId)}>建設</button>
                                                        {mapKind === MapKind.Real ?
                                                            <button onClick={()=>commandHook?.drawTopography(ds.dataSourceId, FeatureType.AREA)}>エリア作成</button>
                                                            :
                                                            <>
                                                                <button onClick={()=>commandHook?.drawRoad(ds.dataSourceId)}>道作成</button>
                                                                <button onClick={()=>commandHook?.drawTopography(ds.dataSourceId, FeatureType.EARTH)}>島作成</button>
                                                                <button onClick={()=>commandHook?.drawTopography(ds.dataSourceId, FeatureType.FOREST)}>緑地作成</button>
                                                            </>
                                                        }
                                                    </>
                                                }
                                            </label>
                                        </>
                                    )
                                })}
                            </>
                        )
                    })}
                </div>
                <div className={styles.Col}>
                    <div className={styles.Row}>
                        <div className={styles.PropName}>フィルタ</div>
                        <label>
                            非表示
                            <input type="radio" checked={filterUnmatchView==='hidden'}
                                    onChange={() => setFilterUnmatchView('hidden')} />
                        </label>
                        <label>
                            不透明
                            <input type="radio" checked={filterUnmatchView==='translucent'}
                                    onChange={() => setFilterUnmatchView('translucent')} />
                        </label>
                    </div>
                    <FilterCondition categories={categories} onChange={(filter) => setFilterConditions(filter)} />
                </div>
                {authLv === Auth.Edit &&
                <>
                    <div className={styles.Col}>
                        <button onClick={commandHook?.moveStructure}>移築</button>
                        <button onClick={commandHook?.changeStructure}>改築</button>
                        <button onClick={commandHook?.removeStructure}>建物解体</button>
                    </div>
                    <div className={styles.Col}>
                        {mapKind === MapKind.Real ?
                            <>
                                <button onClick={commandHook?.editTopography}>エリア編集</button>
                                <button onClick={commandHook?.removeTopography}>エリア削除</button>
                            </>
                            :
                            <>
                                <button onClick={commandHook?.editTopography}>地形編集</button>
                                <button onClick={commandHook?.removeTopography}>地形削除</button>
                                <button onClick={commandHook?.editTopographyInfo}>地名編集</button>
                            </>
                        }
                    </div>
                </>
                }
                <div className={styles.Col}>
                    <button onClick={callGetSnsPreview}>GetSNS</button>
                    <button onClick={confirm}>Confirm</button>
                    <button onClick={getThumbnail}>GetThumbnail</button>
                </div>

                <div className={styles.Col}>
                    <label>
                        itemId
                        <input type='text' value={focusItemId} onChange={(evt)=>{setFocusItemId(evt.target.value)}} />
                    </label>
                    <label>
                        DataSourceId
                        <input type='text' value={focusDataSourceId} onChange={(evt) => {setFocusDataSourceId(evt.target.value)}} />
                    </label>
                    <button onClick={onFocusItem}>Focus Item</button>
                </div>
            </div>
            <div className={styles.Map}>
                <TsunaguMap {...props}
                    mapServer={mapServer}
                    popupMode={popupMode}
                    disabledLabel={disabledLabel}
                    disabledContentDialog={disabledContentDialog}
                    filter={filter}
                    onConnect={onConnect}
                    onMapLoad={onMapLoad}
                    onDatasourceChanged={onDataSourceChanged}
                    onSelect={onSelect}
                    // onClick={(val) => onCallback('onClick', val)}
                    onModeChanged={(val) => onCallback('onModeChanged', val)}
                    onCategoriesLoaded={onCategoriesLoaded}
                    // onAddNewContent={(val) => onCallback('onNewContentInfo', val)}
                    // onLinkUnpointedContent={(val) => onCallback('onLinkUnpointedContent', val)}
                    />
            </div>
        </>
    );
}

type PropRadioProps<T> = {
    name: string;
    onChange: (val: T) => void;
    items: {
        label: string;
        value: T;
    }[];
    default?: T;
}
function PropRadio<T>(props: PropRadioProps<T>) {
    const [ value, setValue ] = useState<T>(props.default ?? props.items[0].value);
    const onChange = useCallback((val: T) => {
        setValue(val);
        props.onChange(val);
    }, [props]);

    return (
        <div className={styles.Row}>
            <span className={styles.PropName}>{props.name}</span>
            {props.items.map((item, index) => {
                return (
                    <label key={index}>
                        <input type="radio" checked={item.value === value} onChange={() => onChange(item.value)} />
                        {item.label}
                    </label>
                );
            })}
        </div>
    )
}
