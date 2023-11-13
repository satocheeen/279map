import React, { useCallback } from 'react';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom } from '../../../store/datasource';
import PopupMenuIcon from '../../popup/PopupMenuIcon';
import { MdDelete } from 'react-icons/md';
import { DataSourceKindType } from '279map-common';
import useConfirm from '../../common/confirm/useConfirm';
import { ConfirmResult } from '../../common/confirm/types';
import { useApi } from '../../../api/useApi';
import { UnlinkContentDatasourceFromMapAPI } from 'tsunagumap-api';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import ListGroup from '../../common/list/ListGroup';
import styles from './CurrentContentsListPage.module.scss';

type Props = {
}

export default function CurrentContentsListPage(props: Props) {
    const [contentDataSources] = useAtom(contentDataSourcesAtom);
    const { confirm } = useConfirm();
    const { callApi } = useApi();
    const [, setSpinner] = useAtom(modalSpinnerAtom);

    const handleDelete = useCallback(async(id: string) => {
        const result = await confirm({
            title: '削除',
            message: 'この地図上で、このコンテンツを使えなくなります。良いですか',
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        setSpinner(true);
        await callApi(UnlinkContentDatasourceFromMapAPI, {
            contents: [
                {
                    datasourceId: id,
                }
            ]
        })
        setSpinner(false);
    }, [confirm, callApi, setSpinner]);

    return (
        <div className={styles.TableContainer}>
            <ListGroup>
                {contentDataSources.map(ds => {
                    return (
                        <ListGroup.Item key={ds.dataSourceId}>
                            <div className={styles.Item}>
                                <span>
                                    {ds.name}
                                </span>
                                <span className={styles.IconArea}>
                                    {!(ds.kind === DataSourceKindType.Content && ds.disableUnlinkMap) &&
                                        <PopupMenuIcon onClick={()=>handleDelete(ds.dataSourceId)}>
                                            <MdDelete />
                                        </PopupMenuIcon>
                                    }
                                </span>
                            </div>
                        </ListGroup.Item>
                    )
                })}
            </ListGroup>
        </div>
    );
}