import React, { useCallback, useMemo, useState, useEffect } from "react";
import styles from './PointsPopup.module.scss';
import { ContentsDefine, DataId, ItemContentInfo, ItemDefine } from "279map-common";
import { MapMode } from "../../types/types";
import { isEqualId } from "../../util/dataUtility";
import MyThumbnail from "../common/image/MyThumbnail";
import { BsThreeDots } from 'react-icons/bs';
import { useMapOptions } from "../../util/useMapOptions";
import { useMap } from "../map/useMap";
import { doCommand } from "../../util/Commander";
import { mapModeAtom, selectedItemIdAtom } from "../../store/operation";
import { filteredContentIdListAtom, filteredItemIdListAtom } from "../../store/filter";
import { useItem } from "../../store/item/useItems";
import { useAtom } from "jotai";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: DataId[];
}

export type PopupItem = {
    id: string;
    content?: ContentsDefine;
}

function hasImageItem(item: ItemDefine): boolean {
    if (item.contents.length===0) return false;
    if (item.contents.some(c => c.hasImage)) return true;
    const hasChildOwnImage = (children: ItemContentInfo[]): boolean => {
        return children.some(child => {
            if (child.hasImage) return true;
            return hasChildOwnImage(child.children);
        });
    }
    return hasChildOwnImage(item.contents);

}
export default function PointsPopup(props: Props) {
    const { map } = useMap();
    const [ filteredItemIdList ] = useAtom(filteredItemIdListAtom);
    const [ filteredContentIdList ] = useAtom(filteredContentIdListAtom);
    const { getDescendantContentsIdList } = useItem();
    const [ targetItems, setTargetItems ] = useState<ItemDefine[]>([]);
    const { getItem } = useItem();

    const getTarget = useCallback(async(itemIds: DataId[]): Promise<ItemDefine[]> => {
        const items = await Promise.all(itemIds.map(itemId => {
            return getItem(itemId);
        }));
        return items.filter(item => item!==undefined) as ItemDefine[];

    }, [getItem]);

    useEffect(() => {
        getTarget(props.itemIds)
        .then(items => setTargetItems(items));
    }, [props.itemIds, getTarget]);

    /**
     * このポップアップで表示するアイテム情報
     */
    const target = useMemo(() => {
        if (props.itemIds.length === 0) {
            return undefined;
        }
        let infos = targetItems;
        // フィルタがかかっている場合は、フィルタ対象のものに絞る
        if (filteredItemIdList) {
            infos = infos.filter(info => filteredItemIdList.some(filteredItemId => isEqualId(filteredItemId, info.id)));
        }
        if (infos.length === 1) {
            return infos[0];
        }
        // 複数アイテムが表示対象の場合は、画像を持つもののみ表示対象
        const ownImageInfos = infos.filter(info => hasImageItem(info));
        if (ownImageInfos.length === 0) {
            // 画像を持つものがない場合は、冒頭
            return infos[0];
        }
        // 最初の画像のみ表示
        return ownImageInfos[0];
    }, [props.itemIds, targetItems, filteredItemIdList]);

    const { popupMode } = useMapOptions();

    // 表示する画像URL
    const imageContentId = useMemo((): DataId | null => {
        if (!target) return null;
        if (popupMode !== 'maximum') return null;

        const getImageOwnerContentId = (content: ItemContentInfo) : DataId | undefined => {
            const isVisible = !filteredContentIdList || filteredContentIdList.some(filteredId => isEqualId(filteredId, content.id));
            if (isVisible && content.hasImage) {
                return content.id;
            }
            let id: DataId | undefined;
            content.children?.some(child => {
                id = getImageOwnerContentId(child);
                return id ? true : false;
            });
            return id;
        }
        if (target.contents.length === 0) {
            return null;
        }
        let imageContentId: DataId | undefined ;
        for (const content of target.contents) {
            imageContentId = getImageOwnerContentId(content);
            if (imageContentId) {
                break;
            }
        }
        if (!imageContentId) {
            return null;
        }
        return imageContentId;

    }, [target, filteredContentIdList, popupMode]);

    // このアイテムの中に含まれるコンテンツの総数
    // （吹き出しに表示していたが、わかりづらいので、現在は未使用）
    const contentsNum = useMemo(() => {
        return props.itemIds.reduce((acc, cur) => {
            const descendants = getDescendantContentsIdList(cur, true);
            return acc + descendants.length;
        }, 0);
    }, [props.itemIds, getDescendantContentsIdList]);

    const [, setSelectedItemId] = useAtom(selectedItemIdAtom);
    const onClick = useCallback((evt: React.MouseEvent) => {
        if (props.itemIds.length === 1) {
            setSelectedItemId(props.itemIds[0]);
            return;
        }
        // 対象が２つ以上ある場合は、重畳選択メニューを表示
        const rect = map?.container.getBoundingClientRect();
        const coordinate = map?.getCoordinateFromPixel([evt.clientX - (rect?.x ?? 0), evt.clientY - (rect?.y ?? 0)]);
        if (coordinate) {
            doCommand({
                command: 'ShowClusterMenu',
                param: {
                    position: coordinate,
                    targets: props.itemIds,
                }
            });
        }
    }, [setSelectedItemId, props.itemIds, map]);

    const [mapMode] = useAtom(mapModeAtom);

    if (!target) {
        return null;
    }
    if (mapMode === MapMode.Drawing) {
        return null;
    }
    return (
        <>
            <div className={`${styles.Popup} ${imageContentId ? '' : styles.Minimum}`} onClick={onClick}>
                <div className={styles.Contents}>
                    {imageContentId ?
                        <div className={styles.ImageContainer}>
                            <MyThumbnail mode='thumb' className={styles.Image} id={imageContentId} alt="contents" />
                        </div>
                        :
                        <div className={styles.ThreeDots}>
                            <BsThreeDots />
                        </div>
                    }
                </div>
                {/* {props.itemIds.length > 1 &&
                    <div className={styles.Number}>{contentsNum}</div>
                } */}
            </div>
            <div className={styles.Triangle} />
        </>
    );
}