import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DriverContext } from '../TestMap';
import styles from '../TestMap.module.scss';
import { FeatureType, MapKind } from '../../entry';
import myStyles from './ItemController.module.scss';
import { useWatch } from '../../util/useWatch2';
import SelectStructureDialog, { SelectStructureDialogParams, SelectStructureDialogResult } from '../common/SelectStructureDialog';
import { ModalHandler } from '../common/useModal';
import { Client, Context } from 'urql';
import { DataUpdateDocument, GetContentDocument } from '../../graphql/generated/graphql';

type Props = {
}

export default function ItemController(props: Props) {
    const { loadedItems, addConsole } = useContext(DriverContext);
    const [ itemId, setItemId ] = useState('');
    const gqlClient = useContext(Context) as Client;

    const result = useMemo(() => {
        if (!itemId) return '';
        const hit = loadedItems.find(item => item.id === itemId);
        if (!hit) return '該当アイテムなし';
        return JSON.stringify(hit, undefined, 2);
    }, [itemId, loadedItems]);

    const [ isSubscribe, setSubscribe ] = useState(false);
    const unsubscribeRef = useRef<()=>void|undefined>();
    const handleLoadContents = useCallback(async() => {
        if (!itemId) return;
        try {
            const res = await gqlClient.query(GetContentDocument, {
                id: itemId,
            });
            addConsole('loadContent result', res.data);
            
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = undefined;
            }

            if (isSubscribe) {
                const subscription = gqlClient.subscription(DataUpdateDocument, {
                    id: itemId,
                }).subscribe((result) => {
                    addConsole('Change Content', itemId, result);
                });
                unsubscribeRef.current = subscription.unsubscribe;
            }
    
        } catch(e) {
            addConsole('loadContentsInItem failed.', e);
        }
    }, [itemId, addConsole, isSubscribe, gqlClient]);

    const handleUnsubscribe = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = undefined;
        }
    }, []);

 
    return (
        <>
            <div>
                <div className={styles.PropName}>アイテム情報表示</div>
                <div className={myStyles.Container}>
                    <div>
                        <label>
                            ItemID
                            <input type='text' value={itemId} onChange={evt=>setItemId(evt.target.value)} />
                        </label>
                        アイテム情報
                        <textarea readOnly value={result} rows={3} />
                    </div>
                    <div>
                        <button onClick={handleLoadContents}>getContent</button>
                        <label>
                            <input type='checkbox' checked={isSubscribe} onChange={evt=>setSubscribe(evt.target.checked)} />
                            Subscribe
                        </label>
                        <button onClick={handleUnsubscribe}>Stop Subscribe</button>
                    </div>
                </div>
            </div>
            <div>
                <div className={styles.PropName}>アイテム操作</div>
                <EditRemoveItemDriver />
            </div>
        </>
    );
}

function EditRemoveItemDriver() {
    const { getMap, mapKind, addConsole } = useContext(DriverContext);
    const [ targets, setTargets ] = useState<FeatureType[]>([]);
    const selectIconDialogRef = useRef<ModalHandler<SelectStructureDialogParams, SelectStructureDialogResult>>(null);

    useWatch(mapKind, () => {
        setTargets([])
    })

    const featureTypes = useMemo(() => {
        if (mapKind === MapKind.Real) {
            return [FeatureType.STRUCTURE, FeatureType.AREA]
        } else {
            return [FeatureType.STRUCTURE, FeatureType.EARTH, FeatureType.FOREST, FeatureType.ROAD]
        }
    }, [mapKind]);

    const handleEditItem = useCallback(() => {
        try {
            getMap()?.editItem({
                targets,
                async iconFunction(icons) {
                    // ピン選択ダイアログ表示
                    if (!selectIconDialogRef.current) return 'cancel';
                    const result = await selectIconDialogRef.current.show({
                        icons,
                    });
                    if (result === null) return 'cancel';
                    return result;
                }
            });
        } catch(e) {
            addConsole('editItem failed.', e);
        }
    }, [getMap, addConsole, targets])

    const handleRemoveItem = useCallback(() => {
        try {
            getMap()?.removeDataByUser(targets);
        } catch(e) {
            addConsole('removeItem failed.', e);
        }
    }, [getMap, addConsole, targets])

    const handleChangeChecked = useCallback((featureType: FeatureType, val: boolean) => {
        if (val) {
            if (!targets.includes(featureType)) {
                setTargets(current => current.concat(featureType))
            }
        } else {
            if (targets.includes(featureType)) {
                setTargets(current => current.filter(item => item !== featureType))
            }
        }
    }, [targets])

    return (
        <div>
            <div>
                {featureTypes.map(featureType => {                
                    return (
                        <label key={featureType}>
                            <input type='checkbox' checked={targets.includes(featureType)}
                                onChange={(evt) => handleChangeChecked(featureType, evt.target.checked)}></input>
                            {featureType}
                        </label>
                    )
                })}
            </div>
            <div>
                <button onClick={handleEditItem}>Edit Item</button>
                <button onClick={handleRemoveItem}>Remove Item</button>
            </div>
            <SelectStructureDialog ref={selectIconDialogRef} />
        </div>
    )
}