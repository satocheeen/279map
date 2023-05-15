import React, { useRef, useState, useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { LinkUnpointContentParam, NewContentInfoParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { useCommand } from '../../api/useCommand';
import { Auth, DataId, DataSourceKindType, DataSourceLinkableContent } from '../../279map-common';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { getMapKey, isEqualId } from '../../store/data/dataUtility';

type Props = {
    target: {
        itemId: DataId;
    } | {
        contentId: DataId;
        isSnsContent: boolean;
        hasChildren: boolean;
    };
    onClick?: () => void;   // メニュー選択時のコールバック
}
let maxId = 0;
export default function AddContentMenu(props: Props) {
    const id = useRef('add-content-menu-'+maxId++);
    const { onAddNewContent, onLinkUnpointedContent } = useContext(OwnerContext);
    const [ isShowSubMenu, setShowSubMenu] = useState(false);
    const { getUnpointDataAPI, registContentAPI, linkContentToItemAPI, getSnsPreviewAPI } = useCommand();
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const dataSources = useSelector((state: RootState) => state.session.currentMapKindInfo?.dataSources ?? []);
    const targetsChildrenLength = useSelector((state: RootState) => {
        if ('itemId' in props.target) {
            const item = state.data.itemMap[getMapKey(props.target.itemId)];
            return item.contents.length;
        } else {
            const contentId = props.target.contentId;
            const content = state.data.contentsList.find(content => isEqualId(content.id, contentId));
            return content?.children?.length ??  0; 
        }
    })

    const editableAuthLv = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap?.authLv === Auth.Edit;
    });

    /**
     * コンテンツ追加可能かチェック
     */
    const isContentAddableTarget = useMemo(() => {
        // 対象のデータソース情報取得
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

        if (dataSource.linkableContent === DataSourceLinkableContent.None) {
            return false;
        }
        if ('contentId' in props.target && props.target.isSnsContent) {
            // SNS自動連携コンテンツは子コンテンツ追加不可
            return false;
        }
        if (dataSource.linkableContent === DataSourceLinkableContent.Multi) {
            return true;
        }
        // linkableContent.Singleの場合は、子コンテンツの数で判断
        if ('itemId' in props.target) {
            const item = itemMap[getMapKey(props.target.itemId)];
            return item?.contents.length === 0;
        } else {
            return !props.target.hasChildren;
        }

    }, [props.target, dataSources, targetsChildrenLength]);

    const creatableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                .filter(ds => {
                    if (ds.readonly) return false;
                    return ds.kind === DataSourceKindType.Content || ds.kind === DataSourceKindType.ItemContent;
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources]);
    const linkableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                .filter(ds => {
                    return ds.kind === DataSourceKindType.Content || ds.kind === DataSourceKindType.ItemContent;
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources]);
    // const creatableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
    //     return dataSources
    //             .filter(ds => {
    //                 if (ds.readonly) return false;
    //                 const hasContent = ds.kinds.some(kind => {
    //                     return kind.type === SourceKind.Content;
    //                 });
    //                 if (!hasContent) return false;
    //                 // Itemとペアのコンテンツは単体作成不可能
    //                 const itemKind = ds.kinds.find(kind => kind.type === SourceKind.Item);
    //                 if (itemKind?.linkableContent === DataSourceLinkableContent.Pair) {
    //                     return false;
    //                 }
    //                 return true;
    //             })
    //             .map(ds => {
    //                 return {
    //                     dataSourceId: ds.dataSourceId,
    //                     name: ds.name,
    //                 }
    //             });
    // }, [dataSources]);

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        if (val === 'new') {
            onAddNewContent({
                parent: props.target,
                dataSources: creatableContentDataSources,
                registContentAPI,
                getSnsPreviewAPI,
            });
        } else {
            onLinkUnpointedContent({
                parent: props.target,
                dataSources: linkableContentDataSources,
                getUnpointDataAPI,
                linkContentToItemAPI,
            });
        }

        if (props.onClick) {
            props.onClick();
        }

    }, [props, creatableContentDataSources, linkableContentDataSources, getSnsPreviewAPI, getUnpointDataAPI, linkContentToItemAPI, onAddNewContent, onLinkUnpointedContent, registContentAPI]);

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
        if (!isContentAddableTarget || !editableAuthLv) {
            return items;
        }
        console.log('creatableContentDataSources', creatableContentDataSources);
        if (creatableContentDataSources.length > 0) {
            items.push({
                name: '新規コンテンツ',
                callback: () => onAddContent('new'),
            });
        }
        if (linkableContentDataSources.length > 0) {
            items.push({
                name: '既存コンテンツ',
                callback: () => onAddContent('unpoint'),
            });
        }
        return items;
    }, [editableAuthLv, onAddContent, creatableContentDataSources, linkableContentDataSources, isContentAddableTarget]);

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