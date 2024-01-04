import React, { useCallback, useMemo, useState, useEffect } from "react";
import styles from './PointsPopup.module.scss';
import { MapMode } from "../../types/types";
import { isEqualId } from "../../util/dataUtility";
import MyThumbnail from "../common/image/MyThumbnail";
import { BsThreeDots } from 'react-icons/bs';
import { useMapOptions } from "../../util/useMapOptions";
import { useMap } from "../map/useMap";
import { dialogTargetAtom, doShowClusterMenuAtom, mapModeAtom } from "../../store/operation";
import { filteredContentIdListAtom, filteredItemIdListAtom } from "../../store/filter";
import { useItems } from "../../store/item/useItems";
import { useAtom } from "jotai";
import { useAtomCallback } from 'jotai/utils';
import { ContentsDefine, ItemDefine } from "../../graphql/generated/graphql";
import { DataId } from "../../types-common/common-types";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: DataId[];

    size: 's' | 'm' | 'l';
}

export type PopupItem = {
    id: string;
    content?: ContentsDefine;
}

export default function PointsPopup(props: Props) {
    const { map } = useMap();
    const [ filteredItemIdList ] = useAtom(filteredItemIdListAtom);
    const [ filteredContentIdList ] = useAtom(filteredContentIdListAtom);
    const [ targetItems, setTargetItems ] = useState<ItemDefine[]>([]);
    const { getItem } = useItems();

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
        const ownImageInfos = infos.filter(info => info.hasImageContentId.length > 0);
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

        if (target.hasImageContentId.length === 0) {
            return null;
        }
        if (!filteredContentIdList) {
            return target.hasImageContentId[0];
        }
        return target.hasImageContentId.find(c => filteredContentIdList.some(f => f.dataSourceId === c.dataSourceId && f.id === c.id)) ?? null;

    }, [target, filteredContentIdList, popupMode]);

    const onClick = useAtomCallback(
        useCallback((get, set, evt: React.MouseEvent) => {
            if (props.itemIds.length === 1) {
                set(dialogTargetAtom, {
                        type: 'item',
                        id: props.itemIds[0],
                    });
                return;
            }
            // 対象が２つ以上ある場合は、重畳選択メニューを表示
            const rect = map?.container.getBoundingClientRect();
            const coordinate = map?.getCoordinateFromPixel([evt.clientX - (rect?.x ?? 0), evt.clientY - (rect?.y ?? 0)]);
            if (coordinate) {
                set(doShowClusterMenuAtom, {
                    position: coordinate,
                    targets: props.itemIds,
                })
            }
        }, [props.itemIds, map])
    );

    const sizeClassName = useMemo(() => {
        switch(props.size) {
            case 's':
                return styles.Small;
            case 'm':
                return styles.Medium;
            case 'l':
                return styles.Large;
        }
    }, [props.size]);

    const [mapMode] = useAtom(mapModeAtom);

    if (!target) {
        return null;
    }
    if (mapMode === MapMode.Drawing) {
        return null;
    }
    return (
        <>
            <div className={`${styles.Popup} ${imageContentId ? '' : styles.Minimum} ${sizeClassName}`} onClick={onClick}>
                <div className={styles.Contents}>
                    {imageContentId ?
                        <div className={`${styles.ImageContainer}`}>
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