import React, { useState, useCallback, useMemo, useRef, useContext } from 'react';
import type {
    ServerInfo, TsunaguMapHandler, onDatasourceChangedParam, 
    CategoryDefine, Condition, DatasourceGroup, 
    DataId, OnConnectParam, OnMapLoadParam, 
    TsunaguMapProps
} from '../entry';
import { Auth, MapKind, FeatureType, DatasourceKindType, getAccessableMapList } from '../entry';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';
import FilterCondition from './FilterCondition';
import { mapId, myMapServer } from './const';
import AuthPanel from './AuthPanel';
import { AuthContext } from './DriverRoot';

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
        },
        {
            id: 'house2',
            imagePath: './icon/house2.png',
            useMaps: [MapKind.Virtual],
        }
    ]
} as TsunaguMapProps;

const defaultPopupMode: TsunaguMapProps['popupMode'] = 'maximum';
export default function TestMap() {
    const mapRef = useRef<TsunaguMapHandler>(null);
    const [ cnt, setCnt ] = useState(0);
    const [ categories, setCategories ] = useState<CategoryDefine[]>([]);
    const [ authLv, setAuthLv ] = useState(Auth.None);
    const onConnect = useCallback((param: OnConnectParam) => {
        console.log('connect', param);
        setMapKind(param.mapDefine.defaultMapKind);
        setAuthLv(param.authLv);
        setCnt(cnt + 1);
    }, [cnt]);

    const onCategoriesLoaded = useCallback((categories: CategoryDefine[]) => {
        setCategories(categories);
    }, []);

    const [ filterCondition, setFilterCondition ] = useState<Condition|undefined>();
    const [ filterUnmatchView, setFilterUnmatchView ] = useState<'hidden'|'translucent'>('hidden');
    const filter = useMemo((): TsunaguMapProps['filter'] => {
        if (!filterCondition) return;
        return {
            condition: filterCondition,
            unmatchView: filterUnmatchView,
        }
    }, [filterCondition, filterUnmatchView]);

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ popupMode, setPopupMode ] = useState<TsunaguMapProps['popupMode']>(defaultPopupMode);

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ disabledContentDialog, setDisableContentDialog ] = useState(false);

    const [ dataSourceGroups, setDataSourceGroups] = useState<DatasourceGroup[]>([]);

    const featureDataSourceGroups = useMemo(() => {
        return dataSourceGroups.map((group): DatasourceGroup => {
            const datasources = group.datasources.filter(ds => {
                return ds.kind !== DatasourceKindType.Content;
            });
            return Object.assign({}, group, {
                datasources,
            });
        });
    }, [dataSourceGroups]);

    const onMapLoad = useCallback((param: OnMapLoadParam) => {
        console.log('onMapLoad', param);
        setMapKind(param.mapKind);
    }, []);

    const onDataSourceChanged = useCallback((param: onDatasourceChangedParam) => {
        console.log('onDataSourceChanged', param.datasourceGroups)
        setDataSourceGroups(param.datasourceGroups);
    }, []);

    const switchMapKind = useCallback((mapKind: MapKind) => {
        mapRef.current?.switchMapKind(mapKind);
    }, []);

    // callbacks
    const onSelect = useCallback((id: DataId) => {
        console.log('onSelect', id, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

    const onCallback = useCallback((msg: string, param: any) => {
        console.log(msg, param);
    }, []);

    const callGetSnsPreview = useCallback(async() => {
        if(!mapRef.current) return;
        const result = await mapRef.current.getSnsPreviewAPI('https://www.instagram.com/umihiko.miya/');
        console.log('result', result);
    }, []);

    const [ focusItemId, setFocusItemId ] = useState('');
    const [ focusDataSourceId, setFocusDataSourceId ] = useState('');
    const onFocusItem = useCallback(() => {
        mapRef.current?.focusItem({
            dataSourceId: focusDataSourceId,
            id: focusItemId,
        }, {
            zoom: false,
        });
    }, [focusItemId, focusDataSourceId]);

    const handleFitAllItems = useCallback(() => {
        mapRef.current?.fitAllItemsExtent();
    }, []);

    const { token } = useContext(AuthContext);
    const mapServer = useMemo((): ServerInfo => {
        return {
            host: myMapServer.host,
            ssl: myMapServer.ssl,
            token,
        }
    }, [token]);

    const getThumbnail = useCallback(async() => {
        if (!mapRef.current) {
            console.warn('commandHook undefined');
            return;
        }
        const img = await mapRef.current?.getThumbnail({
            dataSourceId: '8ab78092-80f3-4ed7-82f4-ed5df3e01c1b',
            id: '00c94264-07f5-4d56-adec-7cac9a326c7e',
        });
        console.log('thumb', img);
    }, []);

    const getAccessableMapListFunc = useCallback(async() => {
        const result = await getAccessableMapList(mapServer.host, mapServer.ssl, mapServer.token);
        console.log('getAccessableMapList', result);
    }, [mapServer]);

    const changeVisibleLayerDataSource = useCallback((dataSourceId: string, visible: boolean) => {
        mapRef.current?.changeVisibleLayer({
            dataSourceId,
        }, visible);
    }, []);

    const changeVisibleLayerGroup = useCallback((group: string, visible: boolean) => {
        mapRef.current?.changeVisibleLayer({
            group,
        }, visible);
    }, []);

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    <AuthPanel />
                </div>

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
                        default={defaultPopupMode}
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
                            <div key={group.name ?? 'none'}>
                                {group.name &&
                                    <label>
                                        <input type="checkbox" checked={group.visible} onChange={(evt) => changeVisibleLayerGroup(group.name ?? '', evt.target.checked)} />
                                        {group.name}
                                    </label>
                                }
                                {group.datasources.map(ds => {
                                    return (
                                        <label key={ds.datasourceId} className={`${group.name ? styles.Child : ''}`}>
                                            <input type="checkbox" checked={ds.visible} onChange={(evt) => changeVisibleLayerDataSource(ds.datasourceId, evt.target.checked)} />
                                            {ds.name}
                                            {(authLv !== Auth.View) &&
                                                <>
                                                    <button onClick={()=>mapRef.current?.drawStructure(ds.datasourceId)}>建設</button>
                                                    {mapKind === MapKind.Real ?
                                                        <button onClick={()=>mapRef.current?.drawTopography(ds.datasourceId, FeatureType.AREA)}>エリア作成</button>
                                                        :
                                                        <>
                                                            <button onClick={()=>mapRef.current?.drawRoad(ds.datasourceId)}>道作成</button>
                                                            <button onClick={()=>mapRef.current?.drawTopography(ds.datasourceId, FeatureType.EARTH)}>島作成</button>
                                                            <button onClick={()=>mapRef.current?.drawTopography(ds.datasourceId, FeatureType.FOREST)}>緑地作成</button>
                                                        </>
                                                    }
                                                </>
                                            }
                                        </label>
                                    )
                                })}
                            </div>
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
                    <FilterCondition categories={categories} onChange={(filter) => setFilterCondition(filter)} />
                </div>
                {authLv !== Auth.View &&
                <>
                    <div className={styles.Col}>
                        <button onClick={() => mapRef.current?.moveStructure()}>移築</button>
                        <button onClick={() => mapRef.current?.changeStructure()}>改築</button>
                        <button onClick={() => mapRef.current?.removeStructure()}>建物解体</button>
                    </div>
                    <div className={styles.Col}>
                        {mapKind === MapKind.Real ?
                            <>
                                <button onClick={() => mapRef.current?.editTopography()}>エリア編集</button>
                                <button onClick={() => mapRef.current?.removeTopography()}>エリア削除</button>
                            </>
                            :
                            <>
                                <button onClick={() => mapRef.current?.editTopography()}>地形編集</button>
                                <button onClick={() => mapRef.current?.removeTopography()}>地形削除</button>
                                <button onClick={() => mapRef.current?.editTopographyInfo()}>地名編集</button>
                            </>
                        }
                    </div>
                </>
                }
                <div className={styles.Col}>
                    <button onClick={() => mapRef.current?.showUserList()}>ユーザ一覧</button>
                    <button onClick={() => mapRef.current?.showContentsSetting()}>コンテンツ設定</button>
                    <button onClick={callGetSnsPreview}>GetSNS</button>
                    <button onClick={getThumbnail}>GetThumbnail</button>
                    <button onClick={getAccessableMapListFunc}>GetAccessableMapList</button>
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
                    <button onClick={handleFitAllItems}>Fit All Item</button>
                </div>
            </div>
            <div className={styles.Map}>
                <TsunaguMap ref={mapRef} {...props}
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
                    onEventsLoaded={(val) => {console.log('onEventsLoaded', val)}}
                    onVisibleItemsChanged={(val) => {console.log('onVisibleItemChanged', val)}}
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
