import React, { useState, useCallback, useMemo, useRef, useContext } from 'react';
import type {
    ServerInfo, TsunaguMapHandler,  
    CategoryDefine, ItemDatasourceInfo, 
    DataId, OnConnectParam, OnMapLoadParam, 
    TsunaguMapProps,
    ContentDatasourceInfo,
    ItemType,
} from '../entry';
import { Auth, MapKind, getAccessableMapList } from '../entry';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';
import { mapId, myMapServer } from './const';
import AuthPanel from './AuthPanel';
import { AuthContext } from './DriverRoot';
import FilterTest from './filter/FilterTest';
import DatasourceDriver from './datasources/DatasourceDriver';
import { ItemDatasourceVisibleList } from '../store/datasource';
import GetUnlinkedContentDriver from './get-unpoint-content/GetUnpointContentDriver';
import LinkContentDriver from './linkcontent/LinkContentDriver';
import ItemController from './item-controller/ItemContriller';

export const DriverContext = React.createContext({
    getMap: () => null as TsunaguMapHandler | null,
    addConsole: (...text: any) => {},
    categories: [] as CategoryDefine[],
    itemDatasources: [] as ItemDatasourceInfo[],
    itemDatasourcesVisibleList: [] as ItemDatasourceVisibleList,
    contentDatasources: [] as ContentDatasourceInfo[],
    authLv: Auth.None as Auth,
    mapKind: MapKind.Real,
    loadedItems: [] as ItemType[],

    filterUnmatchView: 'hidden' as TsunaguMapProps['filterUnmatchView'],
    setFilterUnmatchView: (val: TsunaguMapProps['filterUnmatchView']) => {},
})
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

    const [ consoleText, setConsoleText ] = useState('');
    const consoleRef = useRef<HTMLTextAreaElement>(null);
    const [ consoleCnt, setConsoleCnt ] = useState(1);
    const addConsole = useCallback((...args: any[]) => {
        const id = `[console-${consoleCnt}]`;
        setConsoleCnt(cur => cur + 1);
        const text = id + args.map(arg => {
            if (Array.isArray(arg) || typeof arg === 'object') {
                const str = JSON.stringify(arg);
                return str;
            } else {
                return arg;
            }
        }).join(', ');
        setConsoleText((cur) => cur + (cur.length > 0 ?'\n' : '') + text);
        console.log(id, ...args);
        setTimeout(() => {
            if (consoleRef.current)
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }, 100)
    }, [consoleCnt]);

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
        addConsole('setCategories', categories);
        setCategories(categories);
    }, [addConsole]);

    const [ filterUnmatchView, setFilterUnmatchView ] = useState<'hidden'|'translucent'|undefined>('hidden');

    // switch mapKind
    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ popupMode, setPopupMode ] = useState<TsunaguMapProps['popupMode']>(defaultPopupMode);

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ disabledContentDialog, setDisableContentDialog ] = useState(false);

    const [ itemDatasources, setItemDatasources] = useState<ItemDatasourceInfo[]>([]);
    const [ contentDatasources, setContentDatasources] = useState<ContentDatasourceInfo[]>([]);
    const [ loadedItems, setLoadedItems ] = useState<ItemType[]>([]);

    const onMapLoad = useCallback((param: OnMapLoadParam) => {
        addConsole('onMapLoad', param);
        setMapKind(param.mapKind);
        setItemDatasources(param.itemDatasources);
        setContentDatasources(param.contentDatasources);
    }, [addConsole]);

    const [ itemDatasourcesVisibleList, setItemDatasourceVisibleList ] = useState<ItemDatasourceVisibleList>([]);
    const handleItemDataSourceVisibleChanged = useCallback((param: ItemDatasourceVisibleList) => {
        addConsole('onItemDatasourcesVisibleChanged', param)
        setItemDatasourceVisibleList(param);
    }, [addConsole]);

    const switchMapKind = useCallback((mapKind: MapKind) => {
        mapRef.current?.switchMapKind(mapKind);
    }, []);

    const handleSelectItemByUser = useCallback(async() => {
        const result = await mapRef.current?.selectItemByUser();
        console.log('select item', result);
    }, []);

    // callbacks
    const handleSelectChange = useCallback((item: DataId|null) => {
        console.log('onSelectChange', item, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

    const onCallback = useCallback((msg: string, param: any) => {
        addConsole(msg, param);
    }, [addConsole]);

    const callGetSnsPreview = useCallback(async() => {
        if(!mapRef.current) return;
        const result = await mapRef.current.getSnsPreviewAPI('https://www.instagram.com/umihiko.miya/');
        console.log('result', result);
    }, []);

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

    const getAccessableMapListFunc = useCallback(async() => {
        const result = await getAccessableMapList(mapServer.host, mapServer.ssl, mapServer.token);
        console.log('getAccessableMapList', result);
    }, [mapServer]);

    const handleLoadedItemChanged = useCallback((val: ItemType[]) => {
        addConsole('onLoadedItemCanged', val);
        setLoadedItems(val);
    }, [addConsole])

    const selectItem = useCallback((id: DataId) => {
        mapRef.current?.selectItem(id);
    }, []);

    const unselectItem = useCallback(() => {
        mapRef.current?.selectItem(null);
    }, []);

    return (
        <div className={styles.Container}>
            {/* <div className={styles.HorizontalArea}>
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
                    <button onClick={getAccessableMapListFunc}>GetAccessableMapList</button>
                </div>

                <div className={styles.Col}>
                    <button onClick={handleFitAllItems}>Fit All Item</button>
                    <button onClick={handleSelectItemByUser}>Select Item</button>
                    <button onClick={unselectItem}>UnSelect Item</button>
                </div>
            </div> */}
            <div className={styles.Map}>
                <TsunaguMap ref={mapRef} {...props}
                    mapServer={mapServer}
                    popupMode={popupMode}
                    disabledLabel={disabledLabel}
                    disabledContentDialog={disabledContentDialog}
                    filterUnmatchView={filterUnmatchView}
                    onConnect={onConnect}
                    onMapLoad={onMapLoad}
                    onItemDatasourcesVisibleChanged={handleItemDataSourceVisibleChanged}
                    onSelectChange={handleSelectChange}
                    onLoadedItemsChanged={handleLoadedItemChanged}
                    onItemClick={(val) => onCallback('onClick', val)}
                    onModeChanged={(val) => onCallback('onModeChanged', val)}
                    onCategoriesLoaded={onCategoriesLoaded}
                    onEventsLoaded={(val) => {console.log('onEventsLoaded', val)}}
                    // onAddNewContent={(val) => onCallback('onNewContentInfo', val)}
                    // onLinkUnpointedContent={(val) => onCallback('onLinkUnpointedContent', val)}
                    />
            </div>

            <DriverContext.Provider
                value={{
                    getMap: () => {
                        return mapRef.current
                    },
                    addConsole,
                    categories,
                    itemDatasources,
                    itemDatasourcesVisibleList,
                    contentDatasources,
                    authLv,
                    mapKind,
                    loadedItems,
                    filterUnmatchView,
                    setFilterUnmatchView,
                }}
            >
                <div className={styles.HorizontalArea}>
                    <AuthPanel />
                    <ItemController />
                </div>
                <div className={styles.VerticalArea}>
                    <DatasourceDriver />
                    <FilterTest />
                    <GetUnlinkedContentDriver />
                    <LinkContentDriver />
                </div>
            </DriverContext.Provider>

            <div className={styles.ConsoleArea}>
                <textarea ref={consoleRef} value={consoleText} readOnly />
            </div>
        </div>
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
