import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../api/useApi';
import { GetLinkableContentsAPI } from 'tsunagumap-api';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useWatch } from '../../../util/useWatch2';

type Props = {
    // 追加対象として✔されたコンテンツ一覧
    onChange?: (items: AddableContentItem[]) => void;
}

export type AddableContentItem = {
    datasourceId: string;
    name: string;
    checked?: boolean;
}
export default function AddableContentsListPage(props: Props) {
    const { callApi } = useApi();
    const [ list, setList ] = useState<AddableContentItem[]>([]);
    const [, setModalSpinner] = useAtom(modalSpinnerAtom);

    useWatch(list, 
        useCallback((oldVal, newVal) => {
            if (!props.onChange) return;
            // チェックされたものに絞る
            const targets = newVal.filter(item => item.checked);
            props.onChange(targets);
        }, [props])
    )

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

    const handleChecked = useCallback((index: number, val: boolean) => {
        setList(cur => {
            const newList = structuredClone(cur);
            newList[index].checked = val;
            return newList;
        });
    }, [])

    return (
        <div className={styles.TableContainer}>
            <table className={styles.Table}>
                <thead>
                    <tr>
                        <th></th>
                        <th>コンテンツ名</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((ds, index) => {
                        return (
                            <tr key={ds.datasourceId}>
                                <td>
                                    <input type='checkbox' checked={ds.checked ?? false} onChange={(evt) => handleChecked(index, evt.target.checked)} />
                                </td>
                                <td>{ds.name}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}