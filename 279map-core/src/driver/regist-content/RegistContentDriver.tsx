import React, { useCallback, useContext, useMemo, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './RegistContentDriver.module.scss';
import { DriverContext } from '../TestMap';
import { useWatch } from '../../util/useWatch2';
import { ContentValueMap, DataId } from '../../entry';

type Props = {
}

/**
 * コンテンツ登録・更新ドライバ
 */
export default function RegistContentDriver(props: Props) {
    const { contentDatasources, getMap, addConsole } = useContext(DriverContext);
    const editableDatasources = useMemo(() => {
        return contentDatasources.filter(ds => !ds.config.readonly);
    }, [contentDatasources]);

    const [ mode, setMode ] = useState<'new'|'update'>('new');
    const [ values, setValues ] = useState<ContentValueMap>({});
    const [ targetDsId, setTargetDsId ] = useState<string|undefined>();
    const [ targetContentId, setTargetContentId ] = useState('');
    const [ targetItemId, setTargetItemId ] = useState('');
    const [ loading, setLoading ] = useState(false);

    // useWatch([targetContentId, mode], () => {
    //     console.log('targetContentId', targetContentId);
    //     if (mode === 'update' && targetContentId) {
    //         setTargetDsId(targetContentId.dataSourceId);
    //     }
    // })

    useWatch(editableDatasources, () => {
        if (editableDatasources.length > 0)
            setTargetDsId(editableDatasources[0].datasourceId);
    }, { immediate: true })

    const fields = useMemo(() => {
        const target = contentDatasources.find(ds => ds.datasourceId === targetDsId);
        if (!target) return[];

        return target.config.fields;
    }, [contentDatasources, targetDsId]);

    useWatch(fields, () => {
        setValues({});

    }, {immediate: true })

    const handleChangeDatasource = useCallback((dsId: string) => {
        const target = contentDatasources.find(ds => ds.datasourceId === dsId);
        if (!target) return;

        setTargetDsId(dsId);
    }, [contentDatasources])

    const handleChangeValue = useCallback((key: string, value: any) => {
        const target = fields.find(f => f.key === key);
        const val = target?.type === 'category' ? (value as string).split(',') : value;
        setValues((cur) => {
            return Object.assign({}, cur, {
                [key]: val,
            })
        })
    }, [fields]);

    const disabled = useMemo(() => {
        if (loading) return true;
        if (mode === 'new') {
            if (!targetItemId) return true;
            if (!targetDsId) return true;
        } else {
            if (!targetContentId) return true;
        }
        return false;
    }, [targetItemId, targetDsId, targetContentId, mode, loading]);

    const handleRegist = useCallback(async() => {
        if (!targetDsId) return;
        if (!targetItemId) return;

        const imageField = fields.find(f => f.type === 'image');
        const imageUrl = imageField ? values[imageField.key] : undefined;
        setLoading(true);
        const result = await getMap()?.registContent({
            datasourceId: targetDsId,
            parent: {
                type: 'item',
                id: parseInt(targetItemId),
            },
            values,
        });
        setLoading(false);
        addConsole('registContent', result);
    }, [addConsole, fields, getMap, targetDsId, targetItemId, values]);

    const handleUpdate = useCallback(async() => {
        if (!targetContentId) return;

        const imageField = fields.find(f => f.type === 'image');
        const imageUrl = imageField ? values[imageField.key] : undefined;
        setLoading(true);
        const result = await getMap()?.updateContent({
            id: parseInt(targetContentId),
            values,
        })
        setLoading(false);
        addConsole('updateContent', result);

    }, [addConsole, fields, getMap, targetContentId, values])

    return (
        <div className={`${myStyles.Container}`}>
            <div className={styles.PropName}>コンテンツ登録・更新</div>
            <div>
                <label>
                    <input type='radio' name='mode' checked={mode==='new'} onChange={()=>setMode('new')}></input>
                    新規
                </label>
                <label className={myStyles.TargetID}>
                    対象ItemID
                    <input type='text' disabled={mode==='update'}
                        value={targetItemId} onChange={evt=>setTargetItemId(evt.target.value)} />
                </label>
            </div>
            <div>
                <label>
                    <input type='radio' name='mode' checked={mode==='update'} onChange={()=>setMode('update')}></input>
                    更新
                </label>
                <label className={myStyles.TargetID}>
                    ContentID
                    <input type='text' disabled={mode==='new'}
                        value={targetContentId} onChange={evt=>setTargetContentId(evt.target.value)}
                    />
                </label>
            </div>
            <label>
                対象
                <select onChange={(evt) => handleChangeDatasource(evt.target.value)}
                    disabled={mode==='update'}
                    value={targetDsId}
                >
                    {contentDatasources.map(ds => (
                        <option key={ds.datasourceId} value={ds.datasourceId}>{ds.name}</option>
                    ))}
                </select>
            </label>
            <table className={myStyles.Table}>
                <tbody>
                    {fields.map(field => {
                        const type = function() {
                            switch(field.type) {
                                case 'date':
                                    return 'datetime-local';
                                case 'number':
                                    return 'number';
                                default:
                                    return 'text';
                            }
                        }();
                        return (
                            <tr key={field.key}>
                                <td>
                                    <span className={myStyles.Key}>{field.key}</span><br/>
                                    <span>[{field.type}]</span>
                                </td>
                                <td className={myStyles.Label}>{'label' in field ? field.label : ''}</td>
                                <td>
                                    <input type={type} value={values[field.key]??''} onChange={(evt)=>handleChangeValue(field.key, evt.target.value)} />
                                    {(field.type === 'image' && mode==='update') &&
                                        <label>
                                            <input type='checkbox' checked={values[field.key] === null} onChange={(evt)=>handleChangeValue(field.key, evt.target.checked ? null : undefined )}/>
                                            削除
                                        </label>
                                    }
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <textarea rows={5} readOnly value={JSON.stringify(values)} />
            {mode === 'new' ?
                <button disabled={disabled} onClick={handleRegist}>登録</button>
                :
                <button disabled={disabled} onClick={handleUpdate}>更新</button>
            }
            {loading &&
                <span className={myStyles.RegistingLabel}>登録中...</span>
            }
        </div>
    );
}