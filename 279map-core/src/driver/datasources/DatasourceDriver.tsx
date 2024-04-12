import React, { useCallback, useContext, useMemo } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './DatasourceDriver.module.scss';
import { Auth, FeatureType, MapKind } from '../../entry';
import { DriverContext } from '../TestMap';

type Props = {
}

/**
 * データソースに関する操作を行うドライバ
 * @param props 
 * @returns 
 */
export default function DatasourceDriver(props: Props) {
    const { itemDatasourcesVisibleList, getMap } = useContext(DriverContext);

    const handleChangeVisible = useCallback((group: string, val: boolean) => {
        getMap()?.changeVisibleLayer([
            {
                target: { group },
                visible: val
            }
        ]);
    }, [getMap])

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>データソース</div>
            {itemDatasourcesVisibleList.map(item => {
                return (
                    item.type === 'group' ?
                    <div key={item.groupName}>
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
                                />
                            )
                        })}
                    </div>
                    :
                    <DatasourceItem
                        key={item.datasourceId}
                        datasourceId={item.datasourceId}
                        visible={item.visible}
                    />
                )
            })}

        </div>
    );
}

type DatasourceItemProp = {
    datasourceId: string;
    visible: boolean;
    isChild?: boolean;
}
function DatasourceItem(props: DatasourceItemProp) {
    const { itemDatasources, authLv, getMap, mapKind } = useContext(DriverContext);
    const name = useMemo(() => {
        return itemDatasources.find(ids => ids.datasourceId === props.datasourceId)?.name;
    }, [itemDatasources, props.datasourceId]);

    const handleChangeVisible = useCallback((val: boolean) => {
        // TODO:
        getMap()?.changeVisibleLayer([
            {
                target: {
                    dataSourceId: props.datasourceId,
                },
                visible: val,
            }
        ]);
    }, [getMap, props.datasourceId])

    return (
        <label key={props.datasourceId} className={`${props.isChild ? myStyles.Child : ''}`}>
            <input type="checkbox" checked={props.visible} onChange={(evt) => handleChangeVisible(evt.target.checked)} />
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