import React, { useCallback, useMemo, useState, useEffect, useContext } from "react";
import styles from './PointsPopup.module.scss';
import { ItemInfo, MapMode } from "../../types/types";
import { isEqualId } from "../../util/dataUtility";
import MyThumbnail from "../common/image/MyThumbnail";
import { BsThreeDots } from 'react-icons/bs';
import { useMapOptions } from "../../util/useMapOptions";
import { useMap } from "../map/useMap";
import { selectItemIdAtom, doShowClusterMenuAtom, mapModeAtom, mapViewAtom } from "../../store/operation";
import { filteredDatasAtom, filteredItemIdListAtom } from "../../store/filter";
import { useItems } from "../../store/item/useItems";
import { useAtom } from "jotai";
import { useAtomCallback } from 'jotai/utils';
import { DataId, FeatureType, IconKey } from "../../types-common/common-types";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: DataId[];

    size: 's' | 'm' | 'l';
}

type PopupInfo = {
    type: 'image';
    imageContentDataId: DataId;
} | {
    type: 'three-dot';
} | {
    type: 'mark';
    mark: IconKey;
}
export default function PointsPopup(props: Props) {
    const { map } = useMap();
    const [ filteredItemIdList ] = useAtom(filteredItemIdListAtom);
    const [ filteredContentIdList ] = useAtom(filteredDatasAtom);
    const [ targetItems, setTargetItems ] = useState<ItemInfo[]>([]);
    const { getItem } = useItems();
    const { popupMode } = useMapOptions();

    const getTarget = useCallback(async(itemIds: DataId[]): Promise<ItemInfo[]> => {
        const items = await Promise.all(itemIds.map(itemId => {
            return getItem(itemId);
        }));
        return items.filter(item => item!==undefined) as ItemInfo[];

    }, [getItem]);

    useEffect(() => {
        getTarget(props.itemIds)
        .then(items => setTargetItems(items));
    }, [props.itemIds, getTarget]);

    /**
     * このポップアップで表示する情報
     */
    const target = useMemo((): PopupInfo | undefined => {
        if (targetItems.length === 0) {
            return undefined;
        }

        // マーク指定されているアイテムがある場合は、それを優先
        for (const item of targetItems) {
            if (item.geoProperties.featureType === FeatureType.STRUCTURE && item.geoProperties.mark) {
                return {
                    type: 'mark',
                    mark: item.geoProperties.mark
                }
            }
        }

        if (popupMode === 'minimum') {
            return {
                type: 'three-dot'
            }
        }
        // maximumの場合
        // 画像を探す（表示中のコンテンツ限定）
        let imageContentId: undefined | DataId;
        targetItems.some(item => {
            if (item.content?.hasImage) {
                imageContentId = item.id;
                return true;
            }
            const imageContent = item.linkedContents.find(lc => {
                const isShow = function() {
                    if (!filteredContentIdList) return true;
                    return filteredContentIdList.some(fc => fc === lc.id);
                }();
                return isShow && lc.hasImage;
            });
            if (imageContent) {
                imageContentId = imageContent.id;
                return true;
            }
            return false;
        })
        if (!imageContentId) return {
            type: 'three-dot'
        };
        return {
            type: 'image',
            imageContentDataId: imageContentId,
        }
    }, [targetItems, popupMode, filteredContentIdList]);

    const { onItemClick } = useContext(OwnerContext);
    const onClick = useAtomCallback(
        useCallback((get, set, evt: React.MouseEvent) => {
            if (props.itemIds.length === 1) {
                const itemId = props.itemIds[0];
                set(selectItemIdAtom, itemId);
                if (onItemClick) {
                    onItemClick(itemId)
                }
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
        }, [props.itemIds, map, onItemClick])
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

    if (target.type === 'mark') {
        return (
            <MarkPopup markId={target.mark} />
        )
    }
    return (
        <>
            <div className={`${styles.Popup} ${target.type === 'image' ? '' : styles.Minimum} ${sizeClassName}`} onClick={onClick}>
                <div className={styles.Contents}>
                    {target.type === 'image' ?
                        <div className={`${styles.ImageContainer}`}>
                            <MyThumbnail className={styles.Image} contentId={target.imageContentDataId} alt="contents" />
                        </div>
                        :
                        <div className={styles.ThreeDots}>
                            <BsThreeDots />
                        </div>
                    }
                </div>
            </div>
            <div className={styles.Triangle} />
        </>
    );
}

type MarkPopupProp = {
    markId: IconKey;
}
function MarkPopup(props: MarkPopupProp) {
    const { markDefine } = useContext(OwnerContext);
    const [ mapView ] = useAtom(mapViewAtom);

    const def = useMemo(() => {
        return markDefine?.defines.find(def => def.id === props.markId.id);
    }, [markDefine, props]);

    const sizeClassName = useMemo(() => {
        if (!mapView.zoom) return styles.Small;
        console.log('zoom', mapView.zoom)
        if (mapView.zoom < 7) {
            return styles.Small;
        } else if (mapView.zoom < 9) {
            return styles.Medium;
        } else {
            return styles.Large;
        }
    }, [mapView]);

    if (!def) return null;

    return (
        <div className={`${styles.Mark} ${sizeClassName}`}>
            <img src={def.imagePath} />
        </div>
    )

}