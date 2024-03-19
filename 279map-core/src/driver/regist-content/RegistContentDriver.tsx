import React, { useCallback, useContext, useMemo, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './RegistContentDriver.module.scss';
import { DriverContext } from '../TestMap';
import { useWatch } from '../../util/useWatch2';
import { ContentValueMap, DataId } from '../../entry';

type Props = {
}

export default function RegistContentDriver(props: Props) {
    const { contentDatasources, getMap, addConsole } = useContext(DriverContext);
    const editableDatasources = useMemo(() => {
        return contentDatasources.filter(ds => ds.config.editable);
    }, [contentDatasources]);

    const [ values, setValues ] = useState<ContentValueMap>({});
    const [ targetDsId, setTargetDsId ] = useState<string|undefined>();
    const [ targetItemIdText, setTargetItemIdText ] = useState('');
    const targetItemId = useMemo(() => {
        try {
            const id = JSON.parse(targetItemIdText) as DataId;
            if (!id.dataSourceId || !id.id) return;
            return id;
        } catch(e) {
            return;
        }

    }, [targetItemIdText]);

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
        // const newValue = fields.reduce((acc, cur) => {
        //     const val = function() {
        //         switch(cur.type) {
        //             case 'number':
        //                 return 0;
        //             default:
        //                 return '';
        //         }
        //     }();
        //     Object.assign(acc, {
        //         [cur.key]: val,
        //     })
        //     return acc;
        // }, {});
        // setValues(newValue);
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
        if (!targetItemId) return true;
        if (!targetDsId) return true;
        return false;
    }, [targetItemId, targetDsId]);

    const handleRegist = useCallback(async() => {
        if (!targetDsId) return;
        if (!targetItemId) return;

        const titleField = fields.find(f => f.type === 'title');
        const title = titleField ? values[titleField.key] : '';
        const imageField = fields.find(f => f.type === 'image');
        const imageUrl = imageField ? values[imageField.key] : undefined;
        const result = await getMap()?.registContent({
            datasourceId: targetDsId,
            parent: {
                type: 'item',
                id: targetItemId,
            },
            title,
            values,
            imageUrl,
        });
        addConsole('registContent', result);
    }, [addConsole, fields, getMap, targetDsId, targetItemId, values]);

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>コンテンツ登録</div>
            <label>
                対象
                <select onChange={(evt) => handleChangeDatasource(evt.target.value)}>
                    {contentDatasources.map(ds => (
                        <option key={ds.datasourceId} value={ds.datasourceId}>{ds.name}</option>
                    ))}
                </select>
            </label>
            <table className={myStyles.Table}>
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
                            </td>
                        </tr>
                    )
                })}
            </table>
            <textarea rows={5} readOnly value={JSON.stringify(values)} />
            <label>
                対象ItemID(JSON)
                <input type='text' value={targetItemIdText} onChange={evt=>setTargetItemIdText(evt.target.value)} />
            </label>
            <button disabled={disabled} onClick={handleRegist}>登録</button>
        </div>
    );
}