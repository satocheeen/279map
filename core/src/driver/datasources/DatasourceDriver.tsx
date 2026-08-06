import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './DatasourceDriver.module.scss';
import { Auth, DatasourceLocationKindType, FeatureType, MapKind } from '../../entry';
import { DriverContext } from '../TestMap';
import SelectStructureDialog, { SelectStructureDialogParams, SelectStructureDialogResult } from '../common/SelectStructureDialog';
import { ModalHandler } from '../common/useModal';

type Props = {
}

/**
 * データソースに関する操作を行うドライバ
 * @param props 
 * @returns 
 */
export default function DatasourceDriver(props: Props) {
    const { itemDatasourcesVisibleList, itemDatasources, getMap, addConsole } = useContext(DriverContext);
    const [ temporaryGeoJsonText, setTemporaryGeoJsonText ] = useState('');
    const [ temporaryItemIdText, setTemporaryItemIdText ] = useState('');

    console.log('itemDatasources', itemDatasources)

    const handleChangeGroupVisible = useCallback((group: string, val: boolean) => {
        getMap()?.changeVisibleLayer([
            {
                group,
                visible: val
            }
        ]);
    }, [getMap]);

    const handleChangeDatasourceVisible = useCallback((datasourceId: string, val: boolean) => {
        getMap()?.changeVisibleLayer([
            {
                dataSourceId: datasourceId,
                visible: val,
            }
        ]);
    }, [getMap])

    const [ temporaryItemName, setTemporaryItemName ] = useState('');
    // const handleRegistTemporaryItem = useCallback(async() => {
    //     try {
    //         const itemId = JSON.parse(temporaryItemIdText) as DataId;
    //         const id = await getMap()?.registTemporaryItem(itemId, temporaryItemName);
    //         addConsole('registTemporaryItem finished.', id)
    //     } catch(e) {

    //     }
    // }, [getMap, addConsole, temporaryItemIdText, temporaryItemName])

    const itemGroupVisibleList = useMemo(() => {
        // グループ単位に情報をまとめたもの
        return itemDatasources.reduce((acc, cur) => {
            for (const name of cur.groupNames) {
                console.log('debug', name)
                const visible = itemDatasourcesVisibleList.find(item => item.datasourceId === cur.datasourceId)?.visible ?? false;
                const current = acc.find(item => item.name === name);
                if (!current) {
                    acc.push({
                        name,
                        visible,
                    });
                } else {
                    current.visible = visible;
                }
            }
            return acc;
        }, [] as {name: string; visible: boolean}[]);
    }, [itemDatasources, itemDatasourcesVisibleList])

    return (
        <div>
            <div className={styles.PropName}>データソース</div>
            <div className={myStyles.List}>
                {itemDatasourcesVisibleList.map(item => {
                    return (
                        <DatasourceItem
                            key={item.datasourceId}
                            datasourceId={item.datasourceId}
                            visible={item.visible}
                            onChangeVisible={(val)=>handleChangeDatasourceVisible(item.datasourceId, val)}
                            />
                    )
                })}
            </div>
            <div className={styles.PropName}>データソースグループ</div>
            <div className={myStyles.List}>
                {itemGroupVisibleList.map(group => {
                    return (
                        <div className={myStyles.Group} key={group.name}>
                            <label>
                                <input type="checkbox" checked={group.visible} onChange={(evt) => handleChangeGroupVisible(group.name, evt.target.checked)} />
                                {group.name}
                            </label>
                        </div>
                    )
                })}
            </div>

            <label>
                登録時指定GeoJson
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
                {/* <button onClick={handleRegistTemporaryItem}>registTemporaryItem</button> */}
            </div>
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
    const { itemDatasources, authLv, getMap, mapKind, addConsole } = useContext(DriverContext);
    const selectIconDialogRef = useRef<ModalHandler<SelectStructureDialogParams, SelectStructureDialogResult>>(null);

    const targetDatasource = useMemo(() => {
        return itemDatasources.find(ids => ids.datasourceId === props.datasourceId);
    }, [itemDatasources, props.datasourceId]);

    const name = useMemo(() => {
        return targetDatasource?.name;
    }, [targetDatasource]);

    const handleRegistItem = useCallback(async(featureType: FeatureType.STRUCTURE | FeatureType.AREA | FeatureType.FOREST | FeatureType.EARTH | FeatureType.ROAD) => {
        if (featureType === FeatureType.STRUCTURE) {
            const result = await getMap()?.drawAndRegistItem({
                featureType: FeatureType.STRUCTURE,
                datasourceId: props.datasourceId,
                async iconFunction(icons) {
                    // ピン選択ダイアログ表示
                    if (!selectIconDialogRef.current) return 'cancel';
                    const result = await selectIconDialogRef.current.show({
                        icons,
                    });
                    if (result === null) return 'cancel';
                    return result;
                }
            })
            addConsole('drawAndRegistItem', result);
    
            return;
        }
        const result = await getMap()?.drawAndRegistItem({
            featureType,
            datasourceId: props.datasourceId,
        });
        addConsole('drawAndRegistItem', result);
    }, [getMap, props.datasourceId, addConsole]);

    const showEditMenu = useMemo(() => {
        if (authLv === Auth.View) return false;
        switch(targetDatasource?.config.kind) {
            case DatasourceLocationKindType.RealItem:
            case DatasourceLocationKindType.VirtualItem:
                return true;
            default:
                return false;
        }
    }, [authLv, targetDatasource])

    return (
        <div key={props.datasourceId} className={`${props.isChild ? myStyles.Child : ''}`}>
            <label>
                <input type="checkbox" checked={props.visible} onChange={(evt) => props.onChangeVisible(evt.target.checked)} />
                {name}
            </label>
            {showEditMenu &&
                <>
                    <button onClick={()=>handleRegistItem(FeatureType.STRUCTURE)}>{mapKind === MapKind.Real ? 'ピン作成' : '建設'}</button>
                    {mapKind === MapKind.Real ?
                        <>
                            <button onClick={()=>handleRegistItem(FeatureType.AREA)}>エリア作成</button>
                        </>
                        :
                        <>
                            <button onClick={()=>handleRegistItem(FeatureType.ROAD)}>道作成</button>
                            <button onClick={()=>handleRegistItem(FeatureType.EARTH)}>島作成</button>
                            <button onClick={()=>handleRegistItem(FeatureType.FOREST)}>緑地作成</button>
                        </>
                    }
                </>
            }
            <SelectStructureDialog ref={selectIconDialogRef} />
        </div>
    )


}