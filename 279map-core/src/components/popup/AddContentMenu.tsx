import React, { useRef, useState, useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { NewContentInfoParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { useCommand } from '../../api/useCommand';

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
    const { onNewContentInfo, onNewContentByManual, onLinkUnpointedContent: onNewContentByUnpointedContent } = useContext(OwnerContext);
    const [ isShowSubMenu, setShowSubMenu] = useState(false);
    const { getUnpointDataAPI, registContentAPI, linkContentToItemAPI } = useCommand();

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        if (onNewContentInfo) {
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
        }

        if (val === 'new') {
            onNewContentByManual({
                parent: props.target,
                registContentAPI,
            });
        } else {
            onNewContentByUnpointedContent({
                parent: props.target,
                getUnpointDataAPI,
                linkContentToItemAPI,
            });
        }

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

    return (
        // <>
        //     <PopupMenuIcon id={id.current} tooltip={caption} onClick={onClick}>
        //         <MdOutlineLibraryAdd />
        //     </PopupMenuIcon>
        //     <Tooltip anchorId={id.current} place='right' isOpen={isShowSubMenu}
        //         onHide={onSubMenuHide} name="addContents">
        //         <ul className={styles.SubMenu}>
        //             <li onClick={() => onAddContent('new')}>新規作成</li>
        //             <li onClick={() => onAddContent('unpoint')}>既存コンテンツ</li>
        //         </ul>
        //     </Tooltip>
        // </>
        <>
            <PopupMenuIcon id={id.current} tooltip={caption} onClick={() => onAddContent('unpoint')}>
                <MdOutlineLibraryAdd />
            </PopupMenuIcon>
        </>
);
}