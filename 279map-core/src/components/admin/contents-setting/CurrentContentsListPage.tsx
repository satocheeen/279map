import React, { useCallback } from 'react';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom } from '../../../store/datasource';
import PopupMenuIcon from '../../popup/PopupMenuIcon';
import { MdDelete } from 'react-icons/md';
import { DataSourceKindType } from '279map-common';

type Props = {
}

export default function CurrentContentsListPage(props: Props) {
    const [contentDataSources] = useAtom(contentDataSourcesAtom);
    const handleDelete = useCallback(() => {

    }, []);

    return (
        <div className={styles.TableContainer}>
            <table className={styles.Table}>
                <thead>
                    <tr>
                        <th>コンテンツ名</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {contentDataSources.map(ds => {
                        return (
                            <tr key={ds.dataSourceId}>
                                <td>{ds.name}</td>
                                <td>
                                    {!(ds.kind === DataSourceKindType.Content && ds.disableUnlinkMap) &&
                                        <PopupMenuIcon tooltip="削除" onClick={handleDelete}>
                                            <MdDelete />
                                        </PopupMenuIcon>
                                    }
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}