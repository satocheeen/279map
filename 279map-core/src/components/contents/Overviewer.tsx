import React, { useMemo } from 'react';
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

    return (
        <p className={styles.Overview}>{overview}</p>
    );
}