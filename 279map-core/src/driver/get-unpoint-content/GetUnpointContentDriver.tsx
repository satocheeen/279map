import React, { useCallback, useContext, useState } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';

type Props = {
}

export default function GetUnlinkedContentDriver(props: Props) {
    const { getMap, contentDatasources } = useContext(DriverContext);
    const [ result, setResult ] = useState('');
    const handleClick = useCallback(async(datasourceId: string) => {
        const res = await getMap()?.getUnpointDataAPI(datasourceId);
        if (res) {
            setResult(JSON.stringify(res.contents, undefined, 2))
        }
    }, [])

    return (
        <div className={styles.Col}>
            <div className={styles.PropName}>未割当コンテンツ取得</div>
            {contentDatasources.map(item => {
                return (
                    <div key={item.datasourceId}>
                        <button onClick={()=>handleClick(item.datasourceId)}>取得</button>
                        {item.name}
                    </div>
                )
            })}

            <textarea value={result} readOnly rows={5} />
        </div>
    );
}