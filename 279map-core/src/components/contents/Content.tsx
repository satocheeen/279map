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
import { removeContent } from "../../store/data/dataThunk";
import reactStringReplace from "react-string-replace";
import PopupMenuIcon from "../popup/PopupMenuIcon";
import AddContentMenu from "../popup/AddContentMenu";
import { Auth, ContentAttr, ContentsDefine, DataId, DataSourceLinkableContent, MapKind } from "../../279map-common";
import Spinner from "../common/spinner/Spinner";
import { operationActions } from "../../store/operation/operationSlice";
import { useFilter } from "../../store/useFilter";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import MyThumbnail from "../common/image/MyThumbnail";
import { getContents, getMapKey, isEqualId } from "../../store/data/dataUtility";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { GetImageUrlAPI, SourceKind } from 'tsunagumap-api';
import { useCommand } from "../../api/useCommand";

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
    const { filterTargetContentIds } = useFilter();
    const { onEditContent }  = useContext(OwnerContext);
    const { updateContentAPI, getSnsPreviewAPI } = useCommand();

    /**
     * 表示対象コンテンツかどうか。
     * （フィルタが掛かっている場合に、フィルタ対象のコンテンツのみを表示する）
     */
    const isShow = useMemo(() => {
        if (filterTargetContentIds === undefined) {
            return true;
        }
        return filterTargetContentIds.some(target => isEqualId(target, props.content.id));
    }, [filterTargetContentIds, props.content]);

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

    const onGoToAnotherMap = useCallback(() => {
        if (!props.content.anotherMapItemId) {
            console.warn('別地図にアイテムなし');
            return;
        }
        const anotherMap = mapKind === MapKind.Real ? MapKind.Virtual : MapKind.Real;
        dispatch(operationActions.setMapKind(anotherMap));
        dispatch(operationActions.setFocusItemId(props.content.anotherMapItemId));
        // TODO:
        // searchParams.set('kind', anotherMap);
        // searchParams.set('feature', props.content.anotherMapItemId);
        // setSearchParams(searchParams);
    }, [mapKind, props.content.anotherMapItemId, dispatch]);

    /**
     * イメージロード
     */
    const [showSpinner, setShowSpinner] = useState(false);
    const onImageClick = useCallback(async() => {
        setShowSpinner(true);
        try {
            const imageUrl = await getAPICallerInstance().callApi(GetImageUrlAPI, {
                id: props.content.id,
            });
            window.open(imageUrl, 'image' + props.content.id);
        } catch(e) {
            console.warn('getImageUrl failed.', e);
        } finally {
            setShowSpinner(false);
        }
    }, [props.content.id]);

    const mapServer = useSelector((state: RootState) => state.session.mapServer);
    const onEdit = useCallback(async() => {
        // 編集対象コンテンツをロード
        const contents = (await getContents(mapServer, [{
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
            getSnsPreviewAPI,
            updateContentAPI,
        })
    }, [props.content, onEditContent, getSnsPreviewAPI, updateContentAPI, mapServer]);

    const editableAuthLv = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap?.authLv === Auth.Edit
    });
    const contentDataSource = useSelector((state: RootState) => {
        return state.session.currentMapKindInfo?.dataSources.find(ds => {
            return ds.dataSourceId === props.content.id.dataSourceId;
        });
    });
    const isEditable = useMemo(() => {
        if (!editableAuthLv) return false;

        // データソースがreadonlyの場合は編集不可
        if (contentDataSource?.readonly) return false;

        // SNSコンテンツは編集不可
        if (props.content.isSnsContent) return false;
        return true;
    }, [editableAuthLv, props.content, contentDataSource]);

    const parentDataSource = useSelector((state: RootState) => {
        if (props.parentContentId) {
            const dataSource = state.session.currentMapKindInfo?.dataSources.find(ds => {
                return ds.dataSourceId === props.parentContentId?.dataSourceId;
            });
            return dataSource?.kinds.find(kind => kind.type === SourceKind.Content);

        } else {
            const dataSource = state.session.currentMapKindInfo?.dataSources.find(ds => {
                return ds.dataSourceId === props.itemId.dataSourceId;
            });
            return dataSource?.kinds.find(kind => kind.type === SourceKind.Item);
        }
    });
    const isDeletable = useMemo(() => {
        if (!isEditable) return false;

        // 別の地図で使用されている場合は削除不可にする
        if (props.content.usingAnotherMap) return false;

        // 親アイテムとのペアコンテンツの場合は、削除不可
        return parentDataSource?.linkableContent !== DataSourceLinkableContent.Pair;
    }, [isEditable, parentDataSource, props.content.usingAnotherMap]);

    const isUnlinkable = useMemo(() => {
        if (!editableAuthLv) return false;

        // 親アイテムとのペアコンテンツの場合は、リンク解除不可
        return parentDataSource?.linkableContent !== DataSourceLinkableContent.Pair;
    }, [parentDataSource, editableAuthLv])

    const addableChild = useMemo(() => {
        // SNSコンテンツの場合は子コンテンツの追加不可
        if (props.content.isSnsContent) return false;

        if (!contentDataSource) {
            console.warn('contentのデータソース見つからず（想定外）');
            return false;
        }
        const contentKind = contentDataSource.kinds.find(kind => kind.type === SourceKind.Content);
        
        switch(contentKind?.linkableContent) {
            case DataSourceLinkableContent.Multi:
                return true;
            case DataSourceLinkableContent.Single:
                // 既に子がいるなら追加不可能
                return (props.content.children?.length ?? 0) === 0;
            default:
                return false;
        }
    }, [contentDataSource, props.content]);

    const onDelete = useCallback(async() => {
        const result = await confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        let deleteOnlyLink = true;
        if (isDeletable && isUnlinkable) {
            const result2 = await confirm({
                message: '元データも削除しますか。\nはい→元データごと削除する\nいいえ→地図上からのみ削除する',
                btnPattern: ConfirmBtnPattern.YesNo,
            });
            deleteOnlyLink = result2 === ConfirmResult.No;
        } else if (!isDeletable) {
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

    }, [props.itemId, props.parentContentId, confirm, dispatch, props.content, isDeletable, isUnlinkable]);

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
                    {isEditable &&
                        <PopupMenuIcon tooltip='編集' onClick={onEdit}>
                            <MdEdit />
                        </PopupMenuIcon>
                    }
                    {(isDeletable || isUnlinkable) &&
                        <PopupMenuIcon tooltip="削除" onClick={onDelete}>
                            <MdDelete />
                        </PopupMenuIcon>
                    }
                    {addableChild &&
                        <AddContentMenu target={{contentId: props.content.id}} />
                    }
                    {existAnoterMap &&
                        <PopupMenuIcon tooltip={toolTipMessage} onClick={onGoToAnotherMap}>
                            <CgArrowsExchangeAlt />
                        </PopupMenuIcon>
                    }
                </div>
            </div>
        )
    }, [props.content, title, onGoToAnotherMap, addableChild, existAnoterMap, isEditable, isDeletable, isUnlinkable, onDelete, onEdit, toolTipMessage]);

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
                {showSpinner &&
                    <div className={styles.SpinnerArea}>
                        <Spinner />
                    </div>
                }
                {
                    props.content.image &&
                        <div className={styles.ImageContainer}>
                            <MyThumbnail className={styles.Image} id={props.content.id} onClick={onImageClick} alt="contents"/>
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
    }, [overview, dateStr, categoryTag, showSpinner, props.content, onImageClick]);

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