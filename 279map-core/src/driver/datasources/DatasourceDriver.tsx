import React, { useCallback, useContext, useMemo, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './DatasourceDriver.module.scss';
import { Auth, DataId, DatasourceKindType, FeatureType, ItemDatasourceVisibleList, MapKind } from '../../entry';
import { DriverContext } from '../TestMap';
import { useWatch } from '../../util/useWatch2';

type Props = {
}

/**
 * データソースに関する操作を行うドライバ
 * @param props 
 * @returns 
 */
export default function DatasourceDriver(props: Props) {
    const [ changeMode, setChangeMode ] = useState<'every'|'together'>('every')
    const { itemDatasourcesVisibleList, getMap, addConsole } = useContext(DriverContext);
    const [ myItemDatasourcesVisibleList, setMyItemDatasourcesVisibleList ] = useState<ItemDatasourceVisibleList>([]);
    const [ temporaryGeoJsonText, setTemporaryGeoJsonText ] = useState('');
    const [ temporaryItemIdText, setTemporaryItemIdText ] = useState('');

    const handleChangeVisible = useCallback((group: string, val: boolean) => {
        if (changeMode === 'every') {
            getMap()?.changeVisibleLayer([
                {
                    group,
                    visible: val
                }
            ]);
        } else {
            setMyItemDatasourcesVisibleList(current => {
                return current.map(cur => {
                    if (cur.type === 'group' && cur.groupName === group) {
                        return Object.assign({}, cur, {
                            visible: val,
                        })
                    } else {
                        return cur;
                    }
                })
            })
        }
    }, [getMap, changeMode]);

    const handleChangeDatasourceVisible = useCallback((group: string | undefined, datasourceId: string, val: boolean) => {
        // TODO:
        if (changeMode === 'every') {
            getMap()?.changeVisibleLayer([
                {
                    dataSourceId: datasourceId,
                    visible: val,
                }
            ]);
        } else {
            setMyItemDatasourcesVisibleList(current => {
                return current.map(cur => {
                    if (cur.type === 'group' && cur.groupName === group) {
                        const newDatasources = cur.datasources.map(ds => {
                            if (ds.datasourceId === datasourceId) {
                                return Object.assign({}, ds, { visible: val })
                            } else {
                                return ds;
                            }
                        })
                        console.log('newDatasources', newDatasources)
                        return Object.assign({}, cur, {
                            datasources: newDatasources,
                        })
                    } else if (cur.type === 'datasource' && cur.datasourceId === datasourceId) {
                        return Object.assign({}, cur, {
                            visible: val,
                        })
                    } else {
                        return cur;
                    }
                })
            })

        }
    }, [getMap, changeMode])

    const handleTogetherChange = useCallback(() => {
        const targets: {
            id: string;
            visible: boolean;
        }[] = [];
        myItemDatasourcesVisibleList.forEach(item => {
            if (item.type === 'group') {
                item.datasources.forEach(ds => {
                    targets.push({
                        id: ds.datasourceId,
                        visible: ds.visible,
                    })
                })
            } else {
                targets.push({
                    id: item.datasourceId,
                    visible: item.visible,
                })
            }
        })
        getMap()?.changeVisibleLayer(targets.map(t => {
            return {
                dataSourceId: t.id,
                visible: t.visible,
            }
        }));
    }, [getMap, myItemDatasourcesVisibleList])


    useWatch(itemDatasourcesVisibleList, () => {
        if (changeMode === 'every')
            setMyItemDatasourcesVisibleList(itemDatasourcesVisibleList);
    }, {immediate: true})

    const temporaryGeoJson = useMemo(() => {
        try {
            return JSON.parse(temporaryGeoJsonText) as GeoJSON.Geometry;
        } catch(e) {
            return;
        }
    }, [temporaryGeoJsonText])

    const [ temporaryItemName, setTemporaryItemName ] = useState('');
    const handleRegistTemporaryItem = useCallback(async() => {
        try {
            const itemId = JSON.parse(temporaryItemIdText) as DataId;
            const id = await getMap()?.registTemporaryItem(itemId, temporaryItemName);
            addConsole('registTemporaryItem finished.', id)
        } catch(e) {

        }
    }, [getMap, addConsole, temporaryItemIdText, temporaryItemName])

    return (
        <div>
            <div className={styles.PropName}>データソース</div>
            <div className={myStyles.Row}>
                <span>表示切替え</span>
                <label>
                    <input type='radio' checked={changeMode==='every'} onChange={()=>setChangeMode('every')}/>
                    つど
                </label>
                <label>
                <input type='radio' checked={changeMode==='together'} onChange={()=>setChangeMode('together')} />
                    一括
                </label>
                <button disabled={changeMode==='every'} onClick={handleTogetherChange}>切替え</button>
            </div>
            <div className={myStyles.List}>
                {myItemDatasourcesVisibleList.map(item => {
                    return (
                        item.type === 'group' ?
                        <div className={myStyles.Group} key={item.groupName}>
                            <label>
                                <input type="checkbox" checked={item.visible} onChange={(evt) => handleChangeVisible(item.groupName, evt.target.checked)} />
                                {item.groupName}
                            </label>
                            {item.datasources.map(ds => {
                                return (
                                    <DatasourceItem
                                        key={ds.datasourceId}
                                        datasourceId={ds.datasourceId}
                                        visible={ds.visible}
                                        isChild
                                        temporaryGeoJson={temporaryGeoJson}
                                        onChangeVisible={(val)=>handleChangeDatasourceVisible(item.groupName, ds.datasourceId, val)}
                                    />
                                )
                            })}
                        </div>
                        :
                        <DatasourceItem
                            key={item.datasourceId}
                            datasourceId={item.datasourceId}
                            visible={item.visible}
                            temporaryGeoJson={temporaryGeoJson}
                            onChangeVisible={(val)=>handleChangeDatasourceVisible(undefined, item.datasourceId, val)}
                            />
                    )
                })}
            </div>
            <label>
                一時描画GeoJson
                <textarea className={myStyles.GeoJsonTextarea} value={temporaryGeoJsonText} onChange={evt=>setTemporaryGeoJsonText(evt.target.value)} rows={3} />
            </label>
            <div>
                <label>
                    一時描画ItemID
                    <input type='text' value={temporaryItemIdText} onChange={evt=>setTemporaryItemIdText(evt.target.value)} />
                </label>
                <label>
                    一時描画Item名
                    <input type='text' value={temporaryItemName} onChange={evt=>setTemporaryItemName(evt.target.value)} />
                </label>
                <button onClick={handleRegistTemporaryItem}>registTemporaryItem</button>
            </div>
        </div>
    );
}

type DatasourceItemProp = {
    datasourceId: string;
    visible: boolean;
    isChild?: boolean;
    temporaryGeoJson?: GeoJSON.Geometry;

    onChangeVisible: (visible: boolean) => void;
}
function DatasourceItem(props: DatasourceItemProp) {
    const { itemDatasources, authLv, getMap, mapKind, addConsole } = useContext(DriverContext);

    const targetDatasource = useMemo(() => {
        return itemDatasources.find(ids => ids.datasourceId === props.datasourceId);
    }, [itemDatasources, props.datasourceId]);

    const name = useMemo(() => {
        return targetDatasource?.name;
    }, [targetDatasource]);

    const handleDrawTemporaryFeature = useCallback(async() => {
        const result = await getMap()?.drawTemporaryFeature(props.datasourceId, FeatureType.STRUCTURE, props.temporaryGeoJson);
        addConsole('drawTemporaryFeature', result);
    }, [getMap, addConsole, props.temporaryGeoJson, props.datasourceId])

    return (
        <label key={props.datasourceId} className={`${props.isChild ? myStyles.Child : ''}`}>
            <input type="checkbox" checked={props.visible} onChange={(evt) => props.onChangeVisible(evt.target.checked)} />
            {name}
            {(authLv !== Auth.View) &&
                <>
                    <button onClick={()=>getMap()?.drawStructure(props.datasourceId)}>建設</button>
                    {mapKind === MapKind.Real ?
                        <>
                            <button onClick={()=>getMap()?.drawTopography(props.datasourceId, FeatureType.AREA)}>エリア作成</button>
                            {targetDatasource?.config.kind === DatasourceKindType.RealPointContent &&
                                <button onClick={handleDrawTemporaryFeature}>一時描画</button>
                            }
                        </>
                        :
                        <>
                            <button onClick={()=>getMap()?.drawRoad(props.datasourceId)}>道作成</button>
                            <button onClick={()=>getMap()?.drawTopography(props.datasourceId, FeatureType.EARTH)}>島作成</button>
                            <button onClick={()=>getMap()?.drawTopography(props.datasourceId, FeatureType.FOREST)}>緑地作成</button>
                        </>
                    }
                </>
            }
        </label>
    )


}