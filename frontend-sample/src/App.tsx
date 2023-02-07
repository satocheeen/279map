import { CategoryDefine, FeatureType, MapKind } from '279map-common';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TsunaguMap, OnConnectParam, CommandHookType, FilterDefine, TsunaguMapProps } from '279map-core';
import styles from './App.module.scss';
import { useAuth0 } from "@auth0/auth0-react";

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
            imagePath: '',
            useMaps: [MapKind.Real],
        },
        {
            id: 'house',
            imagePath: './icon/house.png',
            useMaps: [MapKind.Virtual],
        }
    ]
} as TsunaguMapProps;

export default function App() {
    const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [ accessToken, setAccessToken ] = useState<string|undefined>();
    const [ cnt, setCnt ] = useState(0);
    const [ categories, setCategories ] = useState<CategoryDefine[]>([]);
    const [ commandHook, setCommandHook ] = useState<CommandHookType>();
    const onConnect = useCallback((param: OnConnectParam) => {
        console.log('connect', param);
        if (param.result === 'success') {
            setMapKind(param.mapDefine.defaultMapKind);
            setCommandHook(commandHook);
        }
        setCnt(cnt + 1);
    }, [cnt, commandHook]);

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

    useEffect(() => {
        if (!isAuthenticated) {
            setAccessToken(undefined);
            return;
        }
        getAccessTokenSilently()
        .then(token => {
            console.log('token', token);
            setAccessToken(token);
        });
    }, [isAuthenticated]);

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

    return (
        <>
            <div className={styles.Form}>
                <div className={styles.Col}>
                    {isAuthenticated ? 
                        <div>
                            <span>Log in</span>
                            <span>{user?.sub}</span>
                        </div>
                        :
                        <span>Log out </span>
                    }
                    <button onClick={() => loginWithRedirect()}>Login</button>
                    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                        Logout
                    </button>
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
                {accessToken &&
                <TsunaguMap {...props}
                token={accessToken}
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