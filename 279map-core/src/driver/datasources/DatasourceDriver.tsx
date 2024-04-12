import React, { useCallback, useContext, useMemo, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './DatasourceDriver.module.scss';
import { Auth, FeatureType, ItemDatasourceVisibleList, MapKind } from '../../entry';
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
    const { itemDatasourcesVisibleList, getMap } = useContext(DriverContext);
    const [ myItemDatasourcesVisibleList, setMyItemDatasourcesVisibleList ] = useState<ItemDatasourceVisibleList>([]);

    const handleChangeVisible = useCallback((group: string, val: boolean) => {
        if (changeMode === 'every') {
            getMap()?.changeVisibleLayer([
                {
                    target: { group },
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
                    target: {
                        dataSourceId: datasourceId,
                    },
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
                target: { 
                    dataSourceId: t.id,
                },
                visible: t.visible,
            }
        }));
    }, [getMap, myItemDatasourcesVisibleList])


    useWatch(itemDatasourcesVisibleList, () => {
        if (changeMode === 'every')
            setMyItemDatasourcesVisibleList(itemDatasourcesVisibleList);
    }, {immediate: true})

    console.log('myItemDatasourcesVisibleList', myItemDatasourcesVisibleList)

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
                            onChangeVisible={(val)=>handleChangeDatasourceVisible(undefined, item.datasourceId, val)}
                            />
                    )
                })}
            </div>

            <button disabled={changeMode==='every'} onClick={handleTogetherChange}>切替え</button>

        </div>
    );
}

type DatasourceItemProp = {
    datasourceId: string;
    visible: boolean;
    isChild?: boolean;

    onChangeVisible: (visible: boolean) => void;
}
function DatasourceItem(props: DatasourceItemProp) {
    const { itemDatasources, authLv, getMap, mapKind } = useContext(DriverContext);
    const name = useMemo(() => {
        return itemDatasources.find(ids => ids.datasourceId === props.datasourceId)?.name;
    }, [itemDatasources, props.datasourceId]);

    return (
        <label key={props.datasourceId} className={`${props.isChild ? myStyles.Child : ''}`}>
            <input type="checkbox" checked={props.visible} onChange={(evt) => props.onChangeVisible(evt.target.checked)} />
            {name}
            {(authLv !== Auth.View) &&
                <>
                    <button onClick={()=>getMap()?.drawStructure(props.datasourceId)}>建設</button>
                    {mapKind === MapKind.Real ?
                        <button onClick={()=>getMap()?.drawTopography(props.datasourceId, FeatureType.AREA)}>エリア作成</button>
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