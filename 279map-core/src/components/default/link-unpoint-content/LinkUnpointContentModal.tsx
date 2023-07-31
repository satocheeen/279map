import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '../../common';
import { LinkUnpointContentParam } from '../../../types/types';
import { DataId, UnpointContent } from '279map-common';
import styles from './LinkUnpointContentModal.module.scss';
import Card from '../../common/card/Card';
import Spinner from '../../common/spinner/Spinner';
import { getMapKey } from '../../../util/dataUtility';
import Select from '../../common/form/Select';

type Props = {
    param: LinkUnpointContentParam;
    close?: () => void;
}

/**
 * 既存コンテンツをアイテムに紐づけるダイアログ（デフォルト版）
 * @param props 
 * @returns 
 */
export default function LinkUnpointContentModal(props: Props) {
    const [ unpointContents, setUnpointContents ] = useState<UnpointContent[]>([]);
    const [ nextToken, setNextToken ] = useState<string|undefined>();
    const [ loading, setLoading ] = useState(false);
    const [ targetContentDataSourceId, setTargetContentDataSourceId ] = useState<string>();
    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();

    const dataSourceItems = useMemo(() => {
        return props.param.dataSources.map(ds => {
            return {
                value: ds.dataSourceId,
                name: ds.name,
            }
        })
    }, [props.param.dataSources]);

    const onDataSourceChanged = useCallback((dataSourceId: string | undefined) => {
        setUnpointContents([]);
        setTargetContentDataSourceId(dataSourceId);
    }, []);

    const readMore = useCallback(() => {
        if (!targetContentDataSourceId) return;

        setLoading(true);
        setErrorMessage(undefined);
        props.param.getUnpointDataAPI(targetContentDataSourceId, nextToken)
        .then((result) => {
            setUnpointContents(result.contents);
            setNextToken(result.nextToken);
        })
        .catch(err => {
            console.warn('getUnpointDataAPI failed.', err);
            setErrorMessage('コンテンツ取得に失敗しました。\n' + err);
        })
        .finally(() => {
            setLoading(false);
        })
    }, [props.param, nextToken, targetContentDataSourceId]);

    useEffect(() => {
        readMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetContentDataSourceId]);

    const onSelect = useCallback(async(id: DataId) => {
        setLoading(true);
        await props.param.linkContentToItemAPI({
            parent: props.param.parent,
            childContentId: id,
        });
        setLoading(false);
        if (props.close) {
            props.close();
        }
    }, [props]);

    const onCancel = useCallback(() => {
        if (props.close) {
            props.close();
        }
    }, [props]);

    return (
        <Modal show={true}>
            <Modal.Header>
                既存コンテンツを選択
            </Modal.Header>
            <Modal.Body>
                <div className={styles.Container}>
                    <div className={styles.ConditionArea}>
                        <Select items={dataSourceItems} value={targetContentDataSourceId} onSelect={onDataSourceChanged} />
                    </div>
                    <div className={styles.CardArea}>
                        {errorMessage ?
                            <p>{errorMessage}</p>    
                            :
                            <>
                                <ul>
                                    {unpointContents.map((uc) => {
                                        return (
                                            <li key={getMapKey(uc.id)}>
                                                <Card title={uc.title} imageUrl={uc.thumb ? 'data:' + uc.thumb : undefined} 
                                                    overview={uc.overview} onClick={()=>onSelect(uc.id)} />
                                            </li>
                                        ) 
                                    })}
                                </ul>
                                {nextToken &&
                                    <div className={styles.ReadMore}>
                                        <Button variant='link' onClick={readMore}>Read more</Button>
                                    </div>
                                }
                            </>
                        }
                    </div>

                    {loading &&
                        <div className={styles.SpinnerArea}>
                            <Spinner />
                        </div>
                    }
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}