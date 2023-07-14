import React, { ReactNode, useCallback, useMemo, useState, useContext } from "react";
import { UrlType } from "../../types/types";
import styles from './Content.module.scss';
import { MdEdit, MdOutlineOpenInNew, MdDelete } from 'react-icons/md';
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import CategoryBadge from "../common/CategoryBadge";
import * as CommonUtility from '../../util/CommonUtility';
import { CgArrowsExchangeAlt } from "react-icons/cg";
import useConfirm, { ConfirmBtnPattern, ConfirmResult } from "../common/confirm/useConfirm";
import { removeContent, updateContent } from "../../store/data/dataThunk";
import reactStringReplace from "react-string-replace";
import PopupMenuIcon from "../popup/PopupMenuIcon";
import AddContentMenu from "../popup/AddContentMenu";
import { ContentAttr, ContentsDefine, DataId, DataSourceInfo, MapKind } from "279map-common";
import Spinner from "../common/spinner/Spinner";
import { useFilter } from "../../store/useFilter";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import MyThumbnail from "../common/image/MyThumbnail";
import { getMapKey, isEqualId } from "../../store/data/dataUtility";
import { GetImageUrlAPI, GetSnsPreviewAPI, UpdateContentParam } from 'tsunagumap-api';
import { doCommand } from "../../util/Commander";
import { useMap } from "../map/useMap";

type Props = {
    itemId: DataId;
    parentContentId?: DataId;
    content: ContentsDefine;
    onClick?: () => void;
}
/**
 * 詳細ダイアログに表示するコンテンツ。
 * 親子コンテンツを全て表示する。
 * @param props 
 * @returns 
 */
export default function Content(props: Props) {
    const { confirm } = useConfirm();
    const dispatch = useAppDispatch();
    const { filteredContentIdList } = useFilter();
    const { onEditContent }  = useContext(OwnerContext);
    const { getApi } = useMap();

    /**
     * 表示対象コンテンツかどうか。
     * （フィルタが掛かっている場合に、フィルタ対象のコンテンツのみを表示する）
     */
    const isShow = useMemo(() => {
        if (!filteredContentIdList) {
            return true;
        }
        return filteredContentIdList.some(target => isEqualId(target, props.content.id));
    }, [filteredContentIdList, props.content]);

    const urlType = useMemo(() => {
        return props.content.url ? CommonUtility.getUrlType(props.content.url) : undefined;
    }, [props.content]);

    const onClick = useCallback(() => {
        switch(urlType) {
            case UrlType.FacebookVideo:
                break;
            default:
                window.open(props.content.url, getMapKey(props.content.id));
        }
        if(props.onClick !== undefined){
            props.onClick();
        }
    }, [props, urlType]);

    const icon = useMemo((): ReactNode => {
        if (urlType === UrlType.FacebookVideo) {
            return (
                <img src="/icon/film.svg" className={styles.Icon} alt="film icon" />
            )
        } else if (urlType === UrlType.Note) {
            return (
                <img src="/icon/note_logo_symbol.svg" width="36" height="36" alt="note logo" />
            )
        } else {
            return (
                <MdOutlineOpenInNew />
            )
        }
    }, [urlType]);

    const title = useMemo(() => {
        if (props.content.url) {
            return (
                <span className={styles.Link} onClick={onClick}>
                    <span className={styles.IconArea}>
                        {icon}
                    </span>
                    <span>
                        {props.content.title}
                    </span>
                </span>
            )
        } else {
            return (
                <span>
                    {props.content.title}
                </span>
            )
        }
    }, [props.content, icon, onClick]);

    const categories = useSelector((state: RootState) => state.data.categories);

    const categoryTag = useMemo(() => {
        return props.content.category?.map(category => {
            return (
                <CategoryBadge key={category} category={category} existCategories={categories} />
            );
        });
    }, [props.content.category, categories]);

    const dateStr = useMemo(() => {
        if (!props.content.date) {
            return null;
        }
        return dayjs(props.content.date).format('YYYY/MM/DD HH:mm');
    }, [props.content]);

    /**
     * 別の地図で見る
     */
    const existAnoterMap = useMemo(() => {
        return props.content.anotherMapItemId;
    }, [props.content]);

    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    const toolTipMessage = useMemo(() => {
        const mapName = mapKind === MapKind.Real ? '村マップ' : '世界地図';
        return mapName + 'で見る';
    }, [mapKind]);

    const onGoToAnotherMap = useCallback(async() => {
        if (!props.content.anotherMapItemId) {
            console.warn('別地図にアイテムなし');
            return;
        }
        const anotherMap = mapKind === MapKind.Real ? MapKind.Virtual : MapKind.Real;
        await doCommand({
            command: 'ChangeMapKind',
            param: anotherMap,
        });
        doCommand({
            command: 'FocusItem',
            param: {
                itemId: props.content.anotherMapItemId,
            }
        });
    }, [mapKind, props.content.anotherMapItemId]);

    /**
     * イメージロード
     */
    const [showProcessMessage, setShowSpinner] = useState(false);
    const onImageClick = useCallback(async() => {
        setShowSpinner(true);
        try {
            const imageUrl = await getApi().callApi(GetImageUrlAPI, {
                id: props.content.id,
            });
            window.open(imageUrl, 'image' + props.content.id);
        } catch(e) {
            console.warn('getImageUrl failed.', e);
        } finally {
            setShowSpinner(false);
        }
    }, [props.content.id, getApi]);

    const onEdit = useCallback(async() => {
        // 編集対象コンテンツをロード
        const contents = (await getApi().getContents([{
            contentId: props.content.id,
        }]));
        if (!contents || contents?.length === 0) {
            return;
        }
        const content = contents[0];
        const currentAttr: ContentAttr = content.url ? {
            title: content.title,
            overview: content.overview ?? '',
            categories: content.category ?? [],
            type: 'sns',
            url: content.url,
        } : {
            title: content.title,
            overview: content.overview ?? '',
            categories: content.category ?? [],
            type: 'normal',
            date: content.date?.toString(),
            imageUrl: content.image ? '/api/getthumb?id=' + content.id : undefined,
        };
        onEditContent({
            contentId: props.content.id,
            currentAttr,
            getSnsPreviewAPI: async(url: string) => {
                const res = await getApi().callApi(GetSnsPreviewAPI, {
                    url,
                });
                return res;
            },
            updateContentAPI: async(param: UpdateContentParam) => {
                await dispatch(updateContent(param));
        
            },
        })
    }, [props.content, onEditContent, dispatch, getApi]);

    const dataSources = useSelector((state: RootState) => {
        const groups = state.data.dataSourceGroups;
        return groups.reduce((acc, cur) => {
            return acc.concat(cur.dataSources);
        }, [] as DataSourceInfo[]);
    });
    const unlinkable = useMemo(() => {
        const itemDataSource = dataSources.find(ds => ds.dataSourceId === props.itemId.dataSourceId);
        return itemDataSource?.itemContents.Content?.linkableContents.find(lc => lc.contentDatasourceId === props.content.id.dataSourceId)?.unlinkable ?? false;
    }, [dataSources, props.content, props.itemId]);

    const onDelete = useCallback(async() => {
        const result = await confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        let deleteOnlyLink = true;
        if (props.content.isDeletable && unlinkable) {
            const result2 = await confirm({
                message: '元データも削除しますか。\nはい→元データごと削除する\nいいえ→地図上からのみ削除する',
                btnPattern: ConfirmBtnPattern.YesNo,
            });
            deleteOnlyLink = result2 === ConfirmResult.No;
        } else if (!props.content.isDeletable) {
            deleteOnlyLink = true;
        }

        setShowSpinner(true);

        const res = await dispatch(removeContent({
            id: props.content.id,
            itemId: props.itemId,
            parentContentId: props.parentContentId,
            mode: deleteOnlyLink ? 'unlink' : 'alldelete',
        }));

        setShowSpinner(false);

        if ('error' in res) {
            // @ts-ignore
            const errorMessage = res.payload?.message ?? '';
            await confirm({
                message: '削除に失敗しました。\n' + errorMessage,
                btnPattern: ConfirmBtnPattern.OkOnly,
            });
        }

    }, [props.itemId, props.parentContentId, confirm, dispatch, props.content, unlinkable]);

    const overview = useMemo(() => {
        if (!props.content.overview) {
            return null;
        }

        // 改行
        let i = 0;
        let newContent = reactStringReplace(props.content.overview, '\n', () => {
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

    }, [props.content.overview]);

    const header = useMemo(() => {
        return (
            <div className={styles.ItemHeader}>
                <span className={styles.Title}>
                    {title}
                </span>
                <div className={styles.IconAreas}>
                    {props.content.isEditable &&
                        <PopupMenuIcon tooltip='編集' onClick={onEdit}>
                            <MdEdit />
                        </PopupMenuIcon>
                    }
                    {(props.content.isDeletable || unlinkable) &&
                        <PopupMenuIcon tooltip="削除" onClick={onDelete}>
                            <MdDelete />
                        </PopupMenuIcon>
                    }
                    {/* {addableChild && */}
                        <AddContentMenu target={{contentId: props.content.id, isSnsContent: props.content.isSnsContent, children: (props.content.children ?? []).map(c => c.id)}} />
                    {/* } */}
                    {existAnoterMap &&
                        <PopupMenuIcon tooltip={toolTipMessage} onClick={onGoToAnotherMap}>
                            <CgArrowsExchangeAlt />
                        </PopupMenuIcon>
                    }
                </div>
            </div>
        )
    }, [props.content, title, onGoToAnotherMap, existAnoterMap, onDelete, onEdit, toolTipMessage, unlinkable]);

    const body = useMemo(() => {
        return (
            <>
                {overview &&
                    <p className={styles.Overview}>{overview}</p>
                }
                {dateStr && 
                    <span className={styles.Date}>{dateStr}</span>
                }
                {categoryTag}
                {showProcessMessage &&
                    <div className={styles.SpinnerArea}>
                        <Spinner />
                    </div>
                }
                {
                    props.content.image &&
                        <div className={styles.ImageContainer}>
                            <MyThumbnail mode='original' className={styles.Image} id={props.content.id} onClick={onImageClick} alt="contents"/>
                        </div>
                }
                {
                    props.content.videoUrl &&
                        <div className={styles.ImageContainer}>
                            <video className={styles.Video} src={props.content.videoUrl} controls playsInline />
                        </div>
                }
            </>
        )
    }, [overview, dateStr, categoryTag, showProcessMessage, props.content, onImageClick]);

    const children = useMemo(() => {
        return props.content.children?.map(child => {
            return (
                <Content key={getMapKey(child.id)} itemId={props.itemId} parentContentId={props.content.id} content={child} />
            )
        })
    }, [props.content, props.itemId]);

    if (isShow) {
        return (
            <div className={styles.Item}>
                {header}
                {body}
                {children}
            </div>
        )
    } else {
        return (
            <>
                {children}
            </>
        );
    }
}