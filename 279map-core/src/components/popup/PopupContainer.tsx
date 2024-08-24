import { Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import { getMapKey, isEqualId } from '../../util/dataUtility';
import PopupContainerCalculator, { PopupGroupWithPosition } from './PopupContainerCalculator';
import { useMap } from '../map/useMap';
import { useWatch } from '../../util/useWatch2';
import { useMapOptions } from '../../util/useMapOptions';
import { allItemsAtom } from '../../store/item';
import { mapViewAtom } from '../../store/operation';
import { filteredItemIdListAtom } from '../../store/filter';
import { useAtom } from 'jotai';
import { visibleDataSourceIdsAtom } from '../../store/datasource';
import { FeatureType } from '../../entry';

function createKeyFromPopupInfo(param: PopupGroupWithPosition): string {
    if (!param) {
        return '';
    }
    return param.itemIds.map(id => getMapKey(id)).join(',');
}
export default function PopupContainer() {
    const elementRefMap = useRef<{ [key: string]: HTMLDivElement }>({});
    const overlayRefMap = useRef<{ [key: string]: Overlay }>({});

    const [{ extent, zoom }] = useAtom(mapViewAtom);

    const { popupMode } = useMapOptions();
    
    const { map } = useMap();

    const [ allItems ] = useAtom(allItemsAtom)
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);

    const [filteredItemIdList] = useAtom(filteredItemIdListAtom);

    /**
     * ポップアップを表示するアイテム一覧
     * <条件（いずれか）>
     * - コンテンツを持つ（popupModeがhidden以外の場合限定）
     * - markを持つ
     */
    const targetItemList = useMemo(() => {
        const list = allItems.filter(item => visibleDataSourceIds.includes(item.datasourceId))
        .filter(item => {
            // markを持つか、コンテンツを持つものに絞る
            if (item.geoProperties.featureType === FeatureType.STRUCTURE && item.geoProperties.mark) {
                return true;
            }
            if (popupMode === 'hidden') return false;
            // コンテンツを持つものに絞る
            const hasValue = item.content?.hasValue || item.content?.linkedContents.some(c => c.hasValue);
            return hasValue;
        })
        .filter(item => {
            // フィルタが掛かっている場合は条件外のものは除外する
            if (!filteredItemIdList) return true;
            return filteredItemIdList.some(filteredItemId => isEqualId(filteredItemId, item.id));
        });
        return list;
    }, [allItems, popupMode, visibleDataSourceIds, filteredItemIdList]);

    // 表示するポップアップ情報群
    const [popupGroups, setPopupGroups] = useState<PopupGroupWithPosition[]>([]);
    /**
     * 表示するポップアップ情報を更新する。
     * vectorSource.getFeatures()の結果の変更をReactで検知することはできないので、
     * useMemoではなくuseCallbackで実装している。
     */
    const updatePopupGroups = useCallback(async() => {
        if (!map) return;
        const calculator = new PopupContainerCalculator(map, extent);
        calculator.setTargetItemIdList(targetItemList);
        const popupGroups = await calculator.calculatePopupGroup();
        setPopupGroups(popupGroups);

    }, [map, targetItemList, extent]);

    /**
     * 表示対象コンテンツや表示エクステントが変わった契機でポップアップ情報更新
     */
    useWatch([targetItemList, extent], () => {
        console.log('useWatch')
        updatePopupGroups();
    });

    // 開閉時に、zIndexを最前面に
    useEffect(() => {
        // const isOpen = (target: PopupInfo) => {
        //     return target.itemIds.some(itemId => {
        //         return openedPopupItemIds.includes(itemId);
        //     });
        // }
        popupGroups.forEach(target => {
            const key = createKeyFromPopupInfo(target);
            const ele = elementRefMap.current[key]?.parentElement;
            // const open = isOpen(target);
            const open = true;
            if(open) {
                if (ele)
                    ele.style.zIndex = '10';
            } else {
                if (ele)
                    ele.style.zIndex = '0';
            }
        });
    }, [/* openedPopupItemIds, */popupGroups]);

    useEffect(() => {
        // 新しく追加されたものについて、オーバレイを配置する
        const addChildren = popupGroups.filter(target => {
            const exist = Object.keys(overlayRefMap.current).some(key => key === createKeyFromPopupInfo(target));
            return !exist;
        });

        addChildren.forEach(target => {
            if (!target.itemPositions) return;
            const position = getCenter(target.itemPositions);
            if (!position) {
                return;
            }
            const key = createKeyFromPopupInfo(target);
            const overlay = new Overlay({
                positioning: 'bottom-center', //OverlayPositioning.BOTTOM_CENTER,
                stopEvent: false,
                element: elementRefMap.current[key],
            });
            map?.addOverlay(overlay);
            overlay.setPosition([position.longitude, position.latitude]);
            overlayRefMap.current[key] = overlay;
        });

        // 位置更新されたもについて位置を更新する
        const updateChildren = popupGroups.filter(target => {
            const exist = Object.keys(overlayRefMap.current).some(key => key === createKeyFromPopupInfo(target));
            return exist;
        });
        updateChildren.forEach(target => {
            if (!target.itemPositions) return;
            const position = getCenter(target.itemPositions);
            if (!position) {
                return;
            }
            const key = createKeyFromPopupInfo(target);
            const overlay = overlayRefMap.current[key];
            overlay.setPosition([position.longitude, position.latitude]);
        });

        // 削除されたものについて、Overlay削除する
        const removeChildren = Object.keys(overlayRefMap.current).filter(key => {
            const exist = popupGroups.some(target => {
                return key === createKeyFromPopupInfo(target)
            });
            return !exist;
        });
        removeChildren.forEach(key => {
            map?.removeOverlay(overlayRefMap.current[key]);
            delete overlayRefMap.current[key];
        });

    }, [map, popupGroups, zoom]);

    const popupSize = useMemo(() => {
        if (popupGroups.length > 30) {
            return 's';
        } else if (popupGroups.length > 15) {
            return 'm';
        } else {
            return 'l';
        }
    }, [popupGroups]);

    return (
        <>
            {
                popupGroups.map(target => {
                    const key = createKeyFromPopupInfo(target);
                    return (
                        <div key={key}>
                            <div ref={ref => elementRefMap.current[key] = ref as HTMLDivElement}>
                                <PointsPopup itemIds={target.itemIds} size={popupSize} />
                            </div>
                        </div>
                    )
                })
            }
        </>
    );
}
