import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Overviewer.module.scss';
import reactStringReplace from 'react-string-replace';

/**
 * コンテンツ文面を表示するコンポーネント。
 * 文面が長い場合は、省略表示＋「続きを読む」ボタン。
 * 「続きを読む」ボタンを押下すると全体表示＆「閉じる」ボタン表示。
 */
type Props = {
    overview: string;
}

export default function Overviewer(props: Props) {
    const myRef = useRef<HTMLDivElement>(null);
    const descRef = useRef<HTMLDivElement>(null);
    const [isOver, setIsOver] = useState(false);    // 文章が長い場合、true
    const [ showOver, setShowOver ] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            // 文字が収まりきっているかチェック
            if (myRef.current === null || descRef.current === null) {
                return;
            }
            const myHeight = myRef.current.getBoundingClientRect().height;
            const descHeight = descRef.current.getBoundingClientRect().height;
            setIsOver(myHeight < descHeight);
        }, 100);
    }, []);

    const overview = useMemo(() => {
        // 改行
        let i = 0;
        let newContent = reactStringReplace(props.overview, '\n', () => {
            return <br key={'br-' + i++}/>;
        });
        
        // URL文字列をリンクに変更
        const regExp = /(https?:\/\/\S+)/g;
        i = 0;
        return reactStringReplace(newContent, regExp, (match) => {
            return (
                <a href={match} rel="noopener noreferrer" key={'a-' + i++} target="_blank">
                    {match}
                    <i className="icon-external-link" />
                </a>
            );
        }
        );

    }, [props.overview]);

    const onToggle = useCallback(() => {
        setShowOver((cur) => !cur);
    }, [])

    return (
        <div className={styles.Container}>
            <div className={`${styles.Overview} ${showOver ? '' : styles.Close}`} ref={myRef}>
                <div ref={descRef}>
                    {overview}
                </div>
            </div>
            {isOver &&
                <div className={styles.Toggle} onClick={onToggle}>
                    {showOver ? '▲閉じる' : '▼続きを読む'}
                </div>
            }
        </div>
    );
}