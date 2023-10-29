import React, { useEffect, useState } from 'react';
import { useApi } from '../../../api/useApi';
import { GetLinkableContentsAPI } from 'tsunagumap-api';
import styles from './DefaultContentsSettingModal.module.scss';

type Props = {
    onLoadingStateChange: (val: boolean) => void;
}

type Item = {
    datasourceId: string;
    name: string;
}
export default function AddableContentsListPage(props: Props) {
    const { callApi } = useApi();
    const [list, setList] = useState<Item[]>([]);

    useEffect(() => {
        props.onLoadingStateChange(true);
        callApi(GetLinkableContentsAPI, undefined)
        .then((result) => {
            setList(result.contents);
        })
        .finally(() => {
            console.log('hide');
            props.onLoadingStateChange(false);
        })
    }, [callApi, props])

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