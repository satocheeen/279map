import React, { useState, useMemo } from 'react';
import { Modal } from '../../common';
import { useAtom } from 'jotai';
import { dataSourcesAtom } from '../../../store/datasource';
import styles from './DefaultContentsSettingModal.module.scss';

type Props = {
    onClose: () => void;
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
export default function DefaultContentsSettingModal(props: Props) {
    const [show, setShow] = useState(true);
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
        <Modal show={show}
            onCloseBtnClicked={() => setShow(false)}
            onClosed={props.onClose}
            >
            <Modal.Header>
                コンテンツ設定
            </Modal.Header>
            <Modal.Body>
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
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
    );
}