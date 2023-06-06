import React, { useRef, useState, useCallback, useContext, useMemo, useEffect } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { LinkUnpointContentParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { Auth, DataId, DataSourceInfo, DataSourceKindType, DataSourceLinkableContent, UnpointContent } from '279map-common';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/configureStore';
import { getMapKey } from '../../store/data/dataUtility';
import { GetSnsPreviewAPI, GetUnpointDataAPI, LinkContentToItemParam, RegistContentParam } from 'tsunagumap-api';
import { linkContentToItem, registContent } from '../../store/data/dataThunk';
import { useMap } from '../map/useMap';

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
    const dispatch = useAppDispatch();
    const id = useRef('add-content-menu-'+maxId++);
    const { onAddNewContent, onLinkUnpointedContent } = useContext(OwnerContext);
    const [ isShowSubMenu, setShowSubMenu] = useState(false);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const { api } = useMap();

    const dataSources = useSelector((state: RootState) => {
        const groups = state.data.dataSourceGroups;
        return groups.reduce((acc, cur) => {
            return acc.concat(cur.dataSources);
        }, [] as DataSourceInfo[]);
    });

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

    }, [itemMap, props.target, dataSources]);

    const creatableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                .filter(ds => {
                    if (!ds.editable) return false;
                    return ds.kind === DataSourceKindType.Content;
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
                    return ds.kind === DataSourceKindType.Content;
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources]);

    /**
     * ツールチップメニュー表示時にエリア外クリックすると、ツールチップメニューを非表示にする
     */
    useEffect(() => {
        const func = () => {
            if (isShowSubMenu) {
                setShowSubMenu(false);
            }
        }
        if (isShowSubMenu) {
            window.document.addEventListener('click', func);
        }
        return () => {
            window.document.removeEventListener('click', func);
        }
    }, [isShowSubMenu]);

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        setShowSubMenu(false);
        if (val === 'new') {
            onAddNewContent({
                parent: props.target,
                dataSources: creatableContentDataSources,
                registContentAPI: async(param: RegistContentParam) => {
                    const res = await dispatch(registContent(param));
                    if ('error' in res) {
                        // @ts-ignore
                        const errorMessage = res.payload?.message ?? '';
                        throw new Error('registContentAPI failed.' + errorMessage);
                    }
                },
                getSnsPreviewAPI: async(url: string) => {
                    const res = await api.callApi(GetSnsPreviewAPI, {
                        url,
                    });
                    return res;
                },
            });
        } else {
            onLinkUnpointedContent({
                parent: props.target,
                dataSources: linkableContentDataSources,
                getUnpointDataAPI: async(dataSourceId: string, nextToken?: string) => {
                    const result = await api.callApi(GetUnpointDataAPI, {
                        dataSourceId,
                        nextToken,
                    });
                    return result;
                },
                linkContentToItemAPI: async(param: LinkContentToItemParam) => {
                    await dispatch(linkContentToItem(param));
                },
            });
        }

        if (props.onClick) {
            props.onClick();
        }

    }, [api, props, creatableContentDataSources, linkableContentDataSources, dispatch, onAddNewContent, onLinkUnpointedContent]);

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
                    onHide={() => {setShowSubMenu(false)}} name="addContents">
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