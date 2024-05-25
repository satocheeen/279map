import React, { useCallback } from 'react';
import { useAtom } from 'jotai';
import { contentDataSourcesAtom } from '../../../store/datasource';
import PopupMenuIcon from '../../popup/PopupMenuIcon';
import { MdDelete } from 'react-icons/md';
import useConfirm from '../../common/confirm/useConfirm';
import { ConfirmResult } from '../../common/confirm/types';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import ListGroup from '../../common/list/ListGroup';
import styles from './CurrentContentsListPage.module.scss';
import { clientAtom } from 'jotai-urql';

type Props = {
}

export default function CurrentContentsListPage(props: Props) {
    const [contentDataSources] = useAtom(contentDataSourcesAtom);
    const { confirm } = useConfirm();
    const [, setSpinner] = useAtom(modalSpinnerAtom);
    const [ gqlClient ] = useAtom(clientAtom);

    const handleDelete = useCallback(async(id: string) => {
        // const result = await confirm({
        //     title: '削除',
        //     message: 'この地図上で、このコンテンツを使えなくなります。良いですか',
        // });
        // if (result === ConfirmResult.Cancel) {
        //     return;
        // }
        // setSpinner(true);
        // await gqlClient.mutation(UnlinkContentsDatasourceDocument, {
        //     contentsDatasourceIds: [id],
        // });
        // setSpinner(false);
    }, [confirm, gqlClient, setSpinner]);

    return (
        <div className={styles.TableContainer}>
            <ListGroup>
                {contentDataSources.map(ds => {
                    return (
                        <ListGroup.Item key={ds.datasourceId}>
                            <div className={styles.Item}>
                                <span>
                                    {ds.name}
                                </span>
                                <span className={styles.IconArea}>
                                    <PopupMenuIcon onClick={()=>handleDelete(ds.datasourceId)}>
                                        <MdDelete />
                                    </PopupMenuIcon>
                                </span>
                            </div>
                        </ListGroup.Item>
                    )
                })}
            </ListGroup>
        </div>
    );
}