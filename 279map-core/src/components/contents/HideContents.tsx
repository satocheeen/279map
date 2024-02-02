import React, { useCallback, useState } from 'react';
import { ContentsDefine } from '../../graphql/generated/graphql';
import { BsFillCaretRightFill, BsFillCaretDownFill } from 'react-icons/bs';
import styles from './HideContents.module.scss';
import Content from './Content';
import { getMapKey } from '../../util/dataUtility';

type Props = {
    contents: ContentsDefine[];
    childContentsAllshow: boolean;
}

export default function HideContents(props: Props) {
    const [ open, setOpen ] = useState(false);
    const handleToggle = useCallback(() => {
        setOpen((cur) => !cur);
    }, []);

    return (
        <>
            <div className={styles.ToggleHideContents} onClick={handleToggle}>
                {open ? 
                    <BsFillCaretDownFill />
                    :
                    <BsFillCaretRightFill />
                }
                検索ヒット外コンテンツ
            </div>
            {open &&
                props.contents.map((content) => {
                    return (
                        <Content key={getMapKey(content.id)} itemId={content.itemId}  content={content} childContentsAllshow={props.childContentsAllshow} />
                    )
                })
            }
        </>
    )


}