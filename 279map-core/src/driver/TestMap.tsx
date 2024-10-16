import React, { useState, useCallback, useMemo, useRef, useContext } from 'react';
import type {
    ServerInfo, TsunaguMapHandler,  
    CategoryDefine, ItemDatasourceInfo, 
    DataId, OnConnectParam, OnMapLoadParam, 
    TsunaguMapProps,
    ContentDatasourceInfo,
    ItemType,
    ItemDatasourceVisibleList,
    OnConnectResult,
    OnMapLoadResult,
    OverrideItem,
} from '../entry';
import { Auth, MapKind, getAccessableMapList, getMapMetaInfo } from '../entry';
import TsunaguMap from '../components/TsunaguMap/TsunaguMap';
import styles from './TestMap.module.scss';
import { myMapServer } from './const';
import AuthPanel from './AuthPanel';
import { AuthContext } from './DriverRoot';
import FilterTest from './filter/FilterTest';
import DatasourceDriver from './datasources/DatasourceDriver';
import LinkContentDriver from './linkcontent/LinkContentDriver';
import ItemController from './item-controller/ItemContriller';
import SwitchMapKindDriver from './switch-mapkind/SwitchMapKindDriver';
import BasicSettingDriver from './basic-settings/BasicSettingDriver';
import RegistContentDriver from './regist-content/RegistContentDriver';
import LoadImageDriver from './image/LoadImageDriver';
import FocusItemDriver from './focus-item/FocusItemDriver';
import OverrideItemsDriver from './override-items/OverrideItemsDriver';
import BackgroundDriver from './basic-settings/BackgroundDriver';
import { iconDefine as iconDefine2 } from './iconDefine';

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

    setPopupMode: (val: TsunaguMapProps['popupMode']) => {},
    setDisableLabel: (val: boolean) => {},

    setOverrideItems: (val: OverrideItem[] | undefined) => {},
})
const iconDefine1: TsunaguMapProps['iconDefine'] = {
    defines: [
        {
            id: 'pin',
            caption: '',
            imagePath: './icon/pin.svg',
            useMaps: [MapKind.Real],
            defaultColor: '#271AA8',
        },
        {
            id: 'flag1',
            caption: '',
            imagePath: './icon/flag.svg',
            useMaps: [MapKind.Real],
            defaultColor: '#ffd800',
        },
        {
            id: 'pin0066',
            caption: '',
            imagePath: './icon/icon0066_ss.png',
            useMaps: [MapKind.Real],
        },
        {
            id: 'house',
            caption: '',
            imagePath: './icon/house.png',
            useMaps: [MapKind.Virtual],
        },
        {
            id: 'house2',
            caption: '',
            imagePath: './icon/house2.png',
            useMaps: [MapKind.Virtual],
        }
    ],
    defaultIconId: {
        real: 'pin',
        virtual: 'house2',
    }
};
const markDefine: TsunaguMapProps['markDefine'] = {
    defines: [
        {
            id: 'heart',
            imagePath: './mark/heart.svg',            
            keyframeName: 'fire-flush',
        },
        {
            id: 'sun',
            imagePath: './mark/sun.svg',            
            keyframeName: 'fire-flush',
        },
        {
            id: 'snowman',
            imagePath: './mark/snowman.svg',            
            keyframeName: 'swing-bottom',
        },
        {
            id: 'bell',
            imagePath: './mark/bell.svg',
            keyframeName: 'swing-top',
        },
        {
            id: 'timer',
            imagePath: './mark/timer.svg',
            keyframeName: 'rotate',
        },
        {
            id: 'running',
            imagePath: './mark/running.svg',
            keyframeName: 'slide',
        },
        {
            id: 'fire',
            imagePath: './mark/fire-ball.svg',            
            keyframeName: 'fire-flush',
        }
    ]
}

export default function TestMap() {
    const mapRef = useRef<TsunaguMapHandler>(null);

    const [ consoleText, setConsoleText ] = useState('');
    const consoleRef = useRef<HTMLTextAreaElement>(null);
    const consoleCntRef = useRef(1);
    const addConsole = useCallback((...args: any[]) => {
        const id = `[console-${consoleCntRef.current}]`;
        consoleCntRef.current += 1;
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
    }, []);

    const [ cnt, setCnt ] = useState(0);
    const [ mapId, setMapId ] = useState<string|undefined>();
    const [ defaultMapKind, setDefaultMapKind ] = useState<MapKind|undefined>();
    const [ overriderItems, setOverrideItems ] = useState<OverrideItem[]|undefined>();

    const handleMapShow = useCallback((mapId: string, mapKind?: MapKind) => {
        console.log('handleMapShow', mapId, mapKind)
        setMapId(mapId);
        setDefaultMapKind(mapKind);
    }, [])

    const [ categories, setCategories ] = useState<CategoryDefine[]>([]);
    const [ authLv, setAuthLv ] = useState(Auth.None);
    const onConnect = useCallback(async(param: OnConnectParam): Promise<OnConnectResult> => {
        console.log('connect', param);
        setAuthLv(param.authLv);
        setCnt(cnt + 1);

        return {
            mapKind: defaultMapKind,
        }
    }, [cnt, defaultMapKind]);

    const onCategoriesLoaded = useCallback((categories: CategoryDefine[]) => {
        addConsole('setCategories', categories);
        setCategories(categories);
    }, [addConsole]);

    const [ filterUnmatchView, setFilterUnmatchView ] = useState<'hidden'|'translucent'|undefined>('hidden');

    const [ mapKind, setMapKind ] = useState(MapKind.Real);

    // switch popup
    const [ popupMode, setPopupMode ] = useState<TsunaguMapProps['popupMode']>('maximum');

    const [ disabledLabel, setDisableLabel ] = useState(false);

    const [ itemDatasources, setItemDatasources] = useState<ItemDatasourceInfo[]>([]);
    const [ contentDatasources, setContentDatasources] = useState<ContentDatasourceInfo[]>([]);
    const [ loadedItems, setLoadedItems ] = useState<ItemType[]>([]);

    const onMapLoad = useCallback(async(param: OnMapLoadParam): Promise<OnMapLoadResult|void> => {
        addConsole('onMapLoad', param);
        setMapKind(param.mapKind);
        setItemDatasources(param.itemDatasources);
        setContentDatasources(param.contentDatasources);

        // 復帰値テスト
        // 最初のアイテムレイヤのみ表示状態にする
        // return {
        //     initialItemLayerVisibles: param.itemDatasources.map((ds, index) => {
        //         return {
        //             datasourceId: ds.datasourceId,
        //             visible: index === 0,
        //         }
        //     })
        // }
    }, [addConsole]);

    const [ itemDatasourcesVisibleList, setItemDatasourceVisibleList ] = useState<ItemDatasourceVisibleList>([]);
    const handleItemDataSourceVisibleChanged = useCallback((param: ItemDatasourceVisibleList) => {
        addConsole('onItemDatasourcesVisibleChanged', param)
        setItemDatasourceVisibleList(param);
    }, [addConsole]);

    // callbacks
    const handleSelectChange = useCallback((item: DataId|null) => {
        console.log('onSelectChange', item, cnt);
        setCnt(cnt + 1);
    }, [cnt]);

    const onCallback = useCallback((msg: string, param: any) => {
        addConsole(msg, param);
    }, [addConsole]);

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
        const result = await getAccessableMapList(mapServer);
        addConsole('getAccessableMapList', result);
    }, [mapServer, addConsole]);

    const handleGetMapMetaInfoFunc = useCallback(async(id: string) => {
        const result = await getMapMetaInfo(mapServer, id);
        addConsole('getAccessableMapList', result);
    }, [mapServer, addConsole])

    const handleShowingItemsChanged = useCallback((val: ItemType[]) => {
        addConsole('onShowingItemsChanged', val);
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
                </div>

                <div className={styles.Col}>
                    <button onClick={handleFitAllItems}>Fit All Item</button>
                    <button onClick={handleSelectItemByUser}>Select Item</button>
                    <button onClick={unselectItem}>UnSelect Item</button>
                </div>
            </div> */}
            <div className={styles.Map}>
                {mapId &&
                    <TsunaguMap ref={mapRef}
                        iconDefine={iconDefine2}
                        markDefine={markDefine}
                        mapId={mapId}
                        mapServer={mapServer}
                        popupMode={popupMode}
                        disabledLabel={disabledLabel}
                        filterUnmatchView={filterUnmatchView}
                        overrideItems={overriderItems}
                        onConnect={onConnect}
                        onMapLoad={onMapLoad}
                        onMapDefineChanged={(val) => onCallback('onMapDefineChanged', val)}
                        onItemDatasourcesVisibleChanged={handleItemDataSourceVisibleChanged}
                        onSelectChange={handleSelectChange}
                        onShowingItemsChanged={handleShowingItemsChanged}
                        onItemClick={(val) => onCallback('onClick', val)}
                        onModeChanged={(val) => onCallback('onModeChanged', val)}
                        onCategoriesLoaded={onCategoriesLoaded}
                        onEventsLoaded={(val) => {console.log('onEventsLoaded', val)}}
                        />
                }
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
                    setPopupMode,
                    setDisableLabel,
                    setOverrideItems,
                }}
            >
                <div className={styles.WithoutMapArea}>
                    <AuthPanel />
                    <button onClick={getAccessableMapListFunc}>GetAccessableMapList</button>
                    <SwitchMapKindDriver onMapShow={handleMapShow} onGetMetaInfo={handleGetMapMetaInfoFunc} />
                </div>
                <div className={styles.HorizontalArea}>
                    <BasicSettingDriver />
                    <button onClick={() => mapRef.current?.moveItem()}>移築</button>
 
                    <ItemController />
                    <LoadImageDriver />
                </div>
                <div className={styles.VerticalArea}>
                    <BackgroundDriver />
                    <DatasourceDriver />
                    <FilterTest />
                    <RegistContentDriver />
                    <LinkContentDriver />
                    <FocusItemDriver />
                    <OverrideItemsDriver />
                </div>
            </DriverContext.Provider>

            <div className={styles.ConsoleArea}>
                <textarea ref={consoleRef} value={consoleText} readOnly />
            </div>
        </div>
    );
}

