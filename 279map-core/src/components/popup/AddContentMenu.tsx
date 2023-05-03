import React, { useRef, useState, useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { LinkUnpointContentParam, NewContentInfoParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { useCommand } from '../../api/useCommand';
import { DataId } from '../../279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { SourceKind } from 'tsunagumap-api';

type Props = {
    target: {
        itemId: DataId;
    } | {
        contentId: DataId;
    };
    onClick?: () => void;   // メニュー選択時のコールバック
}
let maxId = 0;
export default function AddContentMenu(props: Props) {
    const id = useRef('add-content-menu-'+maxId++);
    const { onNewContentInfo, onNewContentByManual, onLinkUnpointedContent: onNewContentByUnpointedContent } = useContext(OwnerContext);
    const [ isShowSubMenu, setShowSubMenu] = useState(false);
    const { getUnpointDataAPI, registContentAPI, linkContentToItemAPI } = useCommand();

    const dataSources = useSelector((state: RootState) => state.session.currentMapKindInfo?.dataSources ?? []);

    const isEditableTarget = useMemo(() => {
        let dataSourceId: string;
        if ('itemId' in props.target) {
            dataSourceId = props.target.itemId.dataSourceId;
        } else {
            dataSourceId = props.target.contentId.dataSourceId;
        }
        const dataSource = dataSources.find(ds => ds.dataSourceId === dataSourceId);
        if (!dataSource) {
            console.warn('想定外 target dataSource not find.', dataSourceId);
            return false;
        }
        return dataSource.editable;
    }, [props.target, dataSources]);

    const editableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                .filter(ds => ds.editable && ds.kind === SourceKind.Content)
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources]);

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
                dataSources: editableContentDataSources,
                getUnpointDataAPI,
                linkContentToItemAPI,
            });
        }

        if (props.onClick) {
            props.onClick();
        }

    }, [props, editableContentDataSources, onNewContentInfo, getUnpointDataAPI, linkContentToItemAPI, onNewContentByManual, onNewContentByUnpointedContent, registContentAPI]);

    const caption = useMemo(() => {
        if ('itemId' in props.target) {
            return 'コンテンツ追加';
        } else {
            return '子コンテンツ追加';
        }
    }, [props]);

    const subMenuItems = useMemo(() => {
        const items = [] as {
            name: string;
            callback: () => void;
        }[];
        if (!isEditableTarget) {
            return items;
        }
        if (editableContentDataSources.length > 0) {
            items.push({
                name: '新規コンテンツ',
                callback: () => onAddContent('new'),
            });
        }
        items.push({
            name: '既存コンテンツ',
            callback: () => onAddContent('unpoint'),
        });
        return items;
    }, [onAddContent, editableContentDataSources, isEditableTarget]);

    const onClick = useCallback(() => {
        setShowSubMenu((state) => !state);
    }, []);

    const onSubMenuHide = useCallback(() => {
        setShowSubMenu(false); 
    }, []);

    if (subMenuItems.length === 0) {
        return null;
    } else if (subMenuItems.length === 1) {
        return (
            <PopupMenuIcon id={id.current} tooltip={caption} onClick={subMenuItems[0].callback}>
                <MdOutlineLibraryAdd />
            </PopupMenuIcon>
        )
    } else {
        return (
            <>
                <PopupMenuIcon id={id.current} tooltip={caption} onClick={onClick}>
                    <MdOutlineLibraryAdd />
                </PopupMenuIcon>
                <Tooltip anchorId={id.current} place='right' isOpen={isShowSubMenu}
                    onHide={onSubMenuHide} name="addContents">
                    <ul className={styles.SubMenu}>
                        { subMenuItems.map((item, index) => {
                            return (
                                <li key={index} onClick={item.callback}>{item.name}</li>
                            )
                        })}
                    </ul>
                </Tooltip>
            </>
        )
    }
}