import { api } from '279map-common';
import { UnpointContent } from '279map-common';
import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { callApi } from '../../api/api';
import { RootState } from '../../store/configureStore';
import NotionContentCard from './NotionContentCard';
import styles from './SelectUnpointDataList.module.scss';

type Props = {
    cancel?: () => void;    // Cancel押下時のコールバック
    ok?: (data: UnpointContent) => void;        // OK押下時のコールバック
    select?: (data: UnpointContent) => void;        // 選択時のコールバック
}

export default function SelectUnpointDataList(props: Props) {
    const [dataList, setDataList] = useState<UnpointContent[]>([]);
    const [nextToken, setNextToken] = useState<string>();
    const [selectedData, setSelectedData] = useState<UnpointContent>();
    const [showSpinner, setShowSpinner] = useState(false);
    const mapServer = useSelector((state: RootState) => state.session.mapServer);

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = useCallback(async() => {
        setShowSpinner(true);
        try {
            const result = await callApi(mapServer, api.GetUnpointDataAPI, {
                nextToken,
            });

            setDataList(dataList.concat(result.contents));
            setNextToken(result.nextToken);

        } catch(e) {
            console.warn(e);
        } finally {
            setShowSpinner(false);
        }

    }, [dataList, nextToken, mapServer]);

    const onNextClick = useCallback(() => {
        loadData();
    }, [loadData]);

    const onClick = useCallback((data: UnpointContent) => {
        setSelectedData(data);
        if (props.select) {
            props.select(data);
        }
    }, [props]);

    return (
        <>
            <div className={styles.Contents}>
                <p>地図に載せるデータを選択してください。</p>
            </div>
            <div className={styles.CardArea}>
                <ul className={styles.CardList}>
                    {dataList.map(data => {
                        return (
                            <li key={data.id} className={`${styles.Card} ${selectedData === data ? styles.Active : ''}`} onClick={()=>onClick(data)}>
                                <NotionContentCard content={data} />
                            </li>
                        )
                    })}
                </ul>
                {showSpinner && 
                    <div className={styles.SpinnerArea}>
                        <Spinner animation='border' variant='secondary'/>
                        <p>データ取得中...</p>
                    </div>
                }
                {(!showSpinner && nextToken) &&
                    <div className={styles.ShowNext}>
                        <span onClick={onNextClick}>続きを表示</span>
                    </div>
                }
            </div>
        </>
    );
}