import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../api/useApi';
import { GetLinkableContentsAPI } from 'tsunagumap-api';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { modalSpinnerAtom } from '../../common/modal/Modal';

type Props = {
}

type Item = {
    datasourceId: string;
    name: string;
    virtual?: boolean;
}
export default function AddableContentsListPage(props: Props) {
    const { callApi } = useApi();
    const [list, setList] = useState<Item[]>([]);
    const [modalSpinner, setModalSpinner] = useAtom(modalSpinnerAtom);

    useEffect(() => {
        setModalSpinner(true);
        callApi(GetLinkableContentsAPI, undefined)
        .then((result) => {
            setList(result.contents);
        })
        .finally(() => {
            setModalSpinner(false);
        })
    }, [callApi, setModalSpinner])

    const onVirtualCheck = useCallback((index: number, val: boolean) => {
        setList(cur => {
            return cur.map((item, myindex) => {
                if (myindex !== index) {
                    return item;
                } else {
                    return Object.assign({}, item, {
                        virtual: val,
                    })
                }
            })
        })
    }, [])

    return (
        <div className={styles.TableContainer}>
            <table className={styles.Table}>
                <thead>
                    <tr>
                        <th>コンテンツ名</th>
                        <th>村マップ</th>
                        <th>世界地図</th>
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
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}