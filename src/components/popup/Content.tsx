import React, { ReactNode, useContext, useCallback, useMemo, useState } from "react";
import { UrlType } from "../../types/types";
import styles from './Content.module.scss';
import { MdEdit, MdOutlineOpenInNew, MdDelete } from 'react-icons/md';
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import CategoryBadge from "../common/CategoryBadge";
import * as CommonUtility from '../../util/CommonUtility';
import { Spinner } from "react-bootstrap";
import { CgArrowsExchangeAlt } from "react-icons/cg";
import { doCommand } from "../../util/Commander";
import useConfirm, { ConfirmBtnPattern, ConfirmResult } from "../common/confirm/useConfirm";
import { removeContent } from "../../store/data/dataThunk";
import reactStringReplace from "react-string-replace";
import PopupMenuIcon from "./PopupMenuIcon";
import AddContentMenu from "./AddContentMenu";
import { Auth, ContentsDefine, MapKind } from "279map-common";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import { useAPI } from "../../api/useAPI";

type Props = {
    itemId: string;
    parentContentId?: string;
    content: ContentsDefine;
    onClick?: () => void;
}
/**
 * ポップアップ内に表示するコンテント
 * @param props 
 * @returns 
 */
export default function Content(props: Props) {
    const { confirm } = useConfirm();
    const dispatch = useAppDispatch();
    const ownerContext =  useContext(OwnerContext);
    const { apiUrl } = useAPI();

    const urlType = useMemo(() => {
        return props.content.url ? CommonUtility.getUrlType(props.content.url) : undefined;
    }, [props.content]);

    const imageUrl = useMemo(() => {
        if (props.content.image) {
            return `${apiUrl}getthumb?id=${props.content.id}`;
        } else {
            return undefined;
        }
    }, [props.content, apiUrl]);

    const onClick = useCallback(() => {
        switch(urlType) {
            case UrlType.FacebookVideo:
                break;
            default:
                window.open(props.content.url, props.content.id);
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

    const categoryTag = useMemo(() => {
        return props.content.category?.map(category => {
            return (
                <CategoryBadge key={category} category={category} />
            );
        });
    }, [props.content.category]);

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
        // TODO:
        // searchParams.set('kind', anotherMap);
        // searchParams.set('feature', props.content.anotherMapItemId);
        // setSearchParams(searchParams);
    }, [mapKind, props.content.anotherMapItemId]);

    /**
     * イメージロード
     */
    const [showSpinner, setShowSpinner] = useState(false);
    const onImageClick = useCallback(async() => {
        const url = `${apiUrl}getimageurl?id=${props.content.id}`;
        setShowSpinner(true);
        try {
            const response = await fetch(url);
            if(!response.ok) {
                throw response.statusText;
            }
            const imageUrl = await response.text();
            window.open(imageUrl, 'image' + props.content.id);
        } catch(e) {
            console.warn('getImageUrl failed.', e);
        } finally {
            setShowSpinner(false);
        }
    }, [props.content.id, apiUrl]);

    const onEdit = useCallback(() => {
        doCommand({
            command: "EditContentInfo",
            param: {
                operation: 'edit',
                contentId: props.content.id,
            }
        });
    }, [props.content]);

    const editable = useSelector((state: RootState) => state.session.connectedMap?.authLv === Auth.Edit);

    const isEditable = useMemo(() => {
        if (!editable) {
            return false;
        }
        // SNSコンテンツは編集不可
        return !props.content.isSnsContent;
    }, [props.content, editable]);

    const addableChild = useMemo(() => {
        if (!editable) {
            return false;
        }
        return props.content.addableChild;
    }, [props.content, editable]);

    const onDelete = useCallback(async() => {
        const result = await confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        let deleteOnlyLink = true;
        if (!props.content.anotherMapItemId) {
            // もう一方の地図で使用されている場合は、アイテムとのリンク除去
            // 使用されていないならば、どうするか確認
            const result2 = await confirm({
                message: '元データも削除しますか。\nはい→元データごと削除する\nいいえ→地図上からのみ削除する',
                btnPattern: ConfirmBtnPattern.YesNo,
            });
            deleteOnlyLink = result2 === ConfirmResult.No;
        }

        setShowSpinner(true);

        await dispatch(removeContent({
            id: props.content.id,
            itemId: props.itemId,
            parentContentId: props.parentContentId,
            mode: deleteOnlyLink ? 'unlink' : 'alldelete',
        }));

        setShowSpinner(false);

    }, [props.itemId, props.parentContentId, confirm, dispatch, props.content.anotherMapItemId, props.content.id]);

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

    return (
        <div className={styles.Item}>
            <div className={styles.ItemHeader}>
                <span className={styles.Title}>
                    {title}
                </span>
                <div className={styles.IconAreas}>
                    {isEditable &&
                        <>
                            <PopupMenuIcon tooltip='編集' onClick={onEdit}>
                                <MdEdit />
                            </PopupMenuIcon>
                            <PopupMenuIcon tooltip="削除" onClick={onDelete}>
                                <MdDelete />
                            </PopupMenuIcon>
                        </>
                    }
                    {addableChild &&
                        <AddContentMenu contentId={props.content.id} />
                    }
                    {existAnoterMap &&
                        <PopupMenuIcon tooltip={toolTipMessage} onClick={onGoToAnotherMap}>
                            <CgArrowsExchangeAlt />
                        </PopupMenuIcon>
                    }
                </div>
            </div>
            {overview &&
                <p className={styles.Overview}>{overview}</p>
            }
            {dateStr && 
                <span className={styles.Date}>{dateStr}</span>
            }
            {categoryTag}
            {showSpinner &&
                <div className={styles.SpinnerArea}>
                    <Spinner animation="border" variant="primary" />
                </div>
            }
            {
                imageUrl &&
                    <div className={styles.ImageContainer}>
                        <img className={styles.Image} src={imageUrl} onClick={onImageClick} alt="contents" />
                    </div>
            }
            {
                props.content.videoUrl &&
                    <div className={styles.ImageContainer}>
                        <video className={styles.Video} src={props.content.videoUrl} controls playsInline />
                    </div>
            }
            {
                props.content.children?.map(child => {
                    return (
                        <Content key={child.id} itemId={props.itemId} parentContentId={props.content.id} content={child} />
                    )
                })
            }
        </div>
    )
}