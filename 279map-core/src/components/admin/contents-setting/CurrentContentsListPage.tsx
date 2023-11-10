import React from 'react';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom } from '../../../store/datasource';

type Props = {
}

export default function CurrentContentsListPage(props: Props) {
    const [contentDataSources] = useAtom(contentDataSourcesAtom);

    return (
        <div className={styles.TableContainer}>
            <table className={styles.Table}>
                <thead>
                    <tr>
                        <th>コンテンツ名</th>
                    </tr>
                </thead>
                <tbody>
                    {contentDataSources.map(ds => {
                        return (
                            <tr key={ds.dataSourceId}>
                                <td>{ds.name}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}