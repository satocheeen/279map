import React, { useEffect, useState } from 'react';
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

    return (
        <table className={styles.Table}>
            <thead>
                <tr>
                    <th>コンテンツ名</th>
                </tr>
            </thead>
            <tbody>
                {list.map(ds => {
                    return (
                        <tr key={ds.datasourceId}>
                            <td>{ds.name}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
}