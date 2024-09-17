import React, { useCallback, useContext, useState } from 'react';
import styles from '../TestMap.module.scss';
import myStyles from './GetUnlinkedContentDriver.module.scss';
import { DriverContext } from '../TestMap';
import { useWatch } from '../../util/useWatch2';

type Props = {
}

export default function GetUnlinkedContentDriver(props: Props) {
    const { getMap, contentDatasources } = useContext(DriverContext);
    const [ result, setResult ] = useState('');
    const [ target, setTarget ] = useState<string|undefined>();
    const [ keyword, setKeyword ] = useState('');
    const [ nextToken, setNextToken ] = useState('');
    const [ includeAllocated, setIncludeAllocated ] = useState(false);

    useWatch(contentDatasources, () => {
        if (target) return;
        if (contentDatasources.length === 0) return;
        setTarget(contentDatasources[0].datasourceId);
    })

    const handleClick = useCallback(async() => {
        if (!target) return;
        setResult('');
        const res = await getMap()?.getUnpointDataAPI(
            { 
                datasourceId: target,
                keyword: keyword.length > 0 ? keyword : undefined,
                nextToken: nextToken.length > 0 ? nextToken : undefined,
                includeAllocated,
            });
        if (res) {
            setResult(JSON.stringify(res.contents, undefined, 2))
            setNextToken(res.nextToken ?? '');
        }
    }, [getMap, keyword, target, nextToken])

    return (
        <div className={myStyles.Container}>
            <div className={styles.PropName}>未割当コンテンツ取得</div>
            <ul>
                {contentDatasources.map(item => {
                    return (
                        <li key={item.datasourceId}>
                            <label>
                                <input type='radio' name='unpoint-target' checked={item.datasourceId===target} onChange={()=>setTarget(item.datasourceId)} />
                                {item.name}
                            </label>
                        </li>
                    )
                })}
            </ul>
            <label className={myStyles.Row}>
                keyword
                <input type='text' value={keyword} onChange={evt=>setKeyword(evt.target.value)} />
            </label>
            <label className={myStyles.Row}>
                nextToken
                <input type='text' value={nextToken} onChange={evt=>setNextToken(evt.target.value)} />
            </label>
            <label className={myStyles.Row}>
            includeAllocated
                <input type='checkbox' checked={includeAllocated} onChange={evt=>setIncludeAllocated(evt.target.checked)} />
            </label>
            <button onClick={handleClick}>取得</button>

            <textarea value={result} readOnly rows={5} />
        </div>
    );
}