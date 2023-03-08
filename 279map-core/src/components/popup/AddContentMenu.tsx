import React, { useRef, useState, useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { NewContentInfoParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';

type Props = {
    target: {
        itemId: string;
    } | {
        contentId: string;
    };
}
let maxId = 0;
export default function AddContentMenu(props: Props) {
    const id = useRef('add-content-menu-'+maxId++);
    const { onNewContentInfo } = useContext(OwnerContext);
    const [isShowSubMenu, setShowSubMenu] = useState(false);

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        if (!onNewContentInfo) return;

        const param: NewContentInfoParam = val === 'new'
        ? {
            parent: props.target,
            mode: 'manual',
        }
        : {
            parent: props.target,
            mode: 'select-unpoint',
        };
        onNewContentInfo(param);

    }, [props, onNewContentInfo]);

    const caption = useMemo(() => {
        if ('itemId' in props.target) {
            return 'コンテンツ追加';
        } else {
            return '子コンテンツ追加';
        }
    }, [props]);

    const onClick = useCallback(() => {
        setShowSubMenu((state) => !state);
    }, []);

    const onSubMenuHide = useCallback(() => {
        setShowSubMenu(false); 
    }, []);

    if (!onNewContentInfo) return null;

    return (
        <>
            <PopupMenuIcon id={id.current} tooltip={caption} onClick={onClick}>
                <MdOutlineLibraryAdd />
            </PopupMenuIcon>
            <Tooltip anchorId={id.current} place='right' isOpen={isShowSubMenu}
                onHide={onSubMenuHide} name="addContents">
                <ul className={styles.SubMenu}>
                    <li onClick={() => onAddContent('new')}>新規作成</li>
                    <li onClick={() => onAddContent('unpoint')}>既存コンテンツ</li>
                </ul>
            </Tooltip>
        </>
    );
}