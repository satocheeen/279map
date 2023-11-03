import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../api/useApi';
import { GetLinkableContentsAPI } from 'tsunagumap-api';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { dataSourcesAtom } from '../../../store/datasource';
import { useWatch } from '../../../util/useWatch2';

type Props = {
    // 追加対象として✔されたコンテンツ一覧
    onChange?: (items: AddableContentItem[]) => void;
}

export type AddableContentItem = {
    datasourceId: string;
    name: string;
    virtual?: boolean;
    real: {[itemDatasourceId: string]: boolean};
}
export default function AddableContentsListPage(props: Props) {
    const { callApi } = useApi();
    const [list, setList] = useState<AddableContentItem[]>([]);
    const [, setModalSpinner] = useAtom(modalSpinnerAtom);

    useWatch(list, (oldVal, newVal) => {
        if (!props.onChange) return;
        if (list.length === 0) return;
        // チェックされたものに絞る
        const targets = newVal.filter(item => {
            if (item.virtual) return true;
            return Object.values(item.real).some(v => v);
        })

        props.onChange(targets);
    })

    useEffect(() => {
        setModalSpinner(true);
        callApi(GetLinkableContentsAPI, undefined)
        .then((result) => {
            const listeItems = result.contents.map(item => {
                return Object.assign(item, {real: {}})
            })
            setList(listeItems);
        })
        .finally(() => {
            setModalSpinner(false);
        })
    }, [callApi, setModalSpinner])

    const onVirtualCheck = useCallback((index: number, val: boolean) => {
        setList(cur => {
            const newList = structuredClone(cur);
            newList[index].virtual = val;
            return newList;
        });
    }, [])

    const onRealCheck = useCallback((index: number, itemDatasourceId: string, val: boolean) => {
        setList(cur => {
            const newList = structuredClone(cur);
            newList[index].real[itemDatasourceId] = val;
            return newList;
        })
    }, []);
    

    const [dataSources] = useAtom(dataSourcesAtom);
    const realMapLayers = useMemo(() => {
        return dataSources
            .filter(ds => ds.itemContents.RealItem);
    }, [dataSources]);

    return (
        <div className={styles.TableContainer}>
            <table className={styles.Table}>
                <thead>
                    <tr>
                        <th rowSpan={2}>コンテンツ名</th>
                        <th rowSpan={2}>村マップ</th>
                        <th colSpan={realMapLayers.length}>世界地図</th>
                    </tr>
                    <tr>
                        {realMapLayers.map(l => {
                            return (
                                <th key={l.dataSourceId}>{l.name}</th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    {list.map((ds, index) => {
                        return (
                            <tr key={ds.datasourceId}>
                                <td>{ds.name}</td>
                                <td>
                                    <input type='checkbox' checked={ds.virtual ?? false} onChange={(evt) => onVirtualCheck(index, evt.target.checked)} />
                                </td>
                                {realMapLayers.map(l => {
                                    return (
                                        <td key={l.dataSourceId}>
                                            <input type='checkbox' checked={ds.real[l.dataSourceId] ?? false} onChange={(evt) => onRealCheck(index, l.dataSourceId, evt.target.checked)} />
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}