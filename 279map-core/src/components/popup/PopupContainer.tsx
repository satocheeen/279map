import { Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import VectorSource from 'ol/source/Vector';
import { getMapKey, isEqualId } from '../../util/dataUtility';
import { LayerType } from '../TsunaguMap/VectorLayerMap';
import PopupContainerCalculator, { PopupGroupWithPosition } from './PopupContainerCalculator';
import { useMap } from '../map/useMap';
import { useWatch } from '../../util/useWatch';
import { useMapOptions } from '../../util/useMapOptions';
import { allItemsAtom } from '../../store/item';
import { mapViewAtom } from '../../store/operation';
import { filteredItemIdListAtom } from '../../store/filter';
import { ItemDefine } from '279map-common';
import { useAtom } from 'jotai';
import { visibleDataSourceIdsAtom } from '../../store/datasource';

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

    const [itemsMap] = useAtom(allItemsAtom)
    const [ visibleDataSourceIds ] = useAtom(visibleDataSourceIdsAtom);

    const [filteredItemIdList] = useAtom(filteredItemIdListAtom);

    // コンテンツを持つアイテムID一覧
    const hasContentsItemList = useMemo(() => {
        if (popupMode === 'hidden') {
            return [];
        }
        // 表示中のアイテム
        const list = visibleDataSourceIds.reduce((acc, cur) => {
            const items = itemsMap[cur] ?? {};
            return acc.concat(Object.values(items));
        }, [] as ItemDefine[])
        .filter(item => {
            // フィルタが掛かっている場合は条件外のものは除外する
            if (!filteredItemIdList) return true;
            return filteredItemIdList.some(filteredItemId => isEqualId(filteredItemId, item.id));
        });
        return list;
    }, [itemsMap, popupMode, visibleDataSourceIds, filteredItemIdList]);

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
        calculator.setHasContentsItemIdList(hasContentsItemList);
        const popupGroups = await calculator.calculatePopupGroup();
        setPopupGroups(popupGroups);

    }, [map, hasContentsItemList, extent]);

    /**
     * 初期化処理。
     * 地図へのFeature追加検知して、表示するポップアップ情報を更新する。
     */
    useEffect(() => {
        if (!map) return;
        // 画像ロード完了していないと、imagePositionの取得に失敗するので、ここでイベント検知して再描画させる
        const loadendFunc = () => {
            updatePopupGroups();
        }
        map.once('loadend', loadendFunc);

        const itemLayers = map.getLayersOfTheType(LayerType.Point);
        const addfeatureFunc = () => {
            updatePopupGroups();
        }
        itemLayers.forEach(itemLayer => {
            const source = itemLayer.layer.getSource() as VectorSource;
            source.on('addfeature', addfeatureFunc);
        });

        return () => {
            map.un('loadend', loadendFunc);
            itemLayers.forEach(itemLayer => {
                const source = itemLayer.layer.getSource() as VectorSource;
                source?.un('addfeature', addfeatureFunc);
            });
        }

    }, [map, updatePopupGroups]);

    /**
     * 表示対象コンテンツや表示エクステントが変わった契機でポップアップ情報更新
     */
    useWatch(() => {
        updatePopupGroups();
    }, [hasContentsItemList, extent]);

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

    return (
        <>
            {
                popupGroups.map(target => {
                    const key = createKeyFromPopupInfo(target);
                    return (
                        <div key={key}>
                            <div ref={ref => elementRefMap.current[key] = ref as HTMLDivElement}>
                                <PointsPopup itemIds={target.itemIds} />
                            </div>
                        </div>
                    )
                })
            }
        </>
    );
}
