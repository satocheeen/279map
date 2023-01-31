import React, { useEffect, useRef, useState } from 'react';
import styles from './OverviewArea.module.scss';

type Props = {
    contents: string;
}
export default function OverviewArea(props: Props) {
    const overflowAreaRef = useRef<HTMLDivElement>(null);
    const overflowRef = useRef<HTMLDivElement>(null);
    const [isLongContents, setLongContents] = useState(false);  // コンテンツが省略去れるほど長いか
    const [isOmmit, setOmmit] = useState(true); // コンテンツ省略中かどうか

    useEffect(() => {
        // コンテンツの省略可否
        const areaRect = overflowAreaRef.current?.getBoundingClientRect();
        console.log('areaRect', areaRect);
        const contentsRect = overflowRef.current?.getBoundingClientRect();
        if (areaRect && contentsRect) {
            setLongContents(areaRect.height < contentsRect.height);
        }
    }, []);

    return (
        <div>
            <div className={`${styles.OverviewArea} ${isOmmit?styles.Ommit:''}`} ref={overflowAreaRef}>
                <div className={styles.Overview} ref={overflowRef}>
                    {props.contents}
                </div>
            </div>
            {
                isLongContents &&
                <div className={styles.Control}>
                    {
                        isOmmit ?
                           <a href="#" onClick={()=>setOmmit(false)}>全て見る</a>
                        :
                        <a href="#" onClick={()=>setOmmit(true)}>閉じる</a>

                    }
                </div>
            }
        </div>

    )
}