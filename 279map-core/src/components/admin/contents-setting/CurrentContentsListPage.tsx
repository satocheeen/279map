import React, { useMemo } from 'react';
import styles from './DefaultContentsSettingModal.module.scss';
import { useAtom } from 'jotai';
import { dataSourcesAtom } from '../../../store/datasource';
import { Button } from '../../common';

type Props = {
}

type ContentRecord = {
    id: string;
    name: string;
    virtual: boolean;   // 村マップのアイテムに紐づけ可能な場合、true
    real: {
        id: string;
        name: string;
    }[];     // 世界地図のアイテム（レイヤ）に紐づけ可能なアイテムデータソースの一覧
}

export default function CurrentContentsListPage(props: Props) {
    const [dataSources] = useAtom(dataSourcesAtom);

    const contentRecords = useMemo(() => {
        return dataSources.filter(ds => {
            return ds.itemContents.Content;
        }).map((ds): ContentRecord => {
            const virtual = dataSources.some(ds2 => {
                return ds2.itemContents.VirtualItem?.linkableContents.some(lc => lc.contentDatasourceId === ds.dataSourceId)
            });
            const real = dataSources.filter(ds2 => {
                return ds2.itemContents.RealItem?.linkableContents.some(lc => lc.contentDatasourceId === ds.dataSourceId);
            }).map(ds2 => ({
                id: ds2.dataSourceId,
                name: ds2.name,
            }));
            return {
                id: ds.dataSourceId,
                name: ds.name,
                virtual,
                real,
            }
        })
    }, [dataSources]);

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
                    {contentRecords.map(ds => {
                        return (
                            <tr key={ds.id}>
                                <td>{ds.name}</td>
                                <td>{ds.virtual ? '✔' : ''}</td>
                                <td>{ds.real.map(r => r.name).join(',')}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}