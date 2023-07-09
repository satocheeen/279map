import { Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import VectorSource from 'ol/source/Vector';
import { getMapKey, isEqualId } from '../../store/data/dataUtility';
import { LayerType } from '../TsunaguMap/VectorLayerMap';
import PopupContainerCalculator, { PopupGroupWithPosition } from './PopupContainerCalculator';
import { useMap } from '../map/useMap';
import { useWatch } from '../../util/useWatch';
import { useMapOptions } from '../../util/useMapOptions';
import useDataSource from '../../store/data/useDataSource';
import { useFilter } from '../../store/useFilter';

function createKeyFromPopupInfo(param: PopupGroupWithPosition): string {
    if (!param) {
        return '';
    }
    return param.itemIds.map(id => getMapKey(id)).join(',');
}
export default function PopupContainer() {
    const elementRefMap = useRef<{ [key: string]: HTMLDivElement }>({});
    const overlayRefMap = useRef<{ [key: string]: Overlay }>({});

    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const extent = useSelector((state: RootState) => state.operation.mapView.extent);

    const { popupMode } = useMapOptions();
    
    const { getMap } = useMap();

    const { isVisibleDataSource } = useDataSource();

    const { filteredItemIdList } = useFilter();

    // コンテンツを持つアイテムID一覧
    const hasContentsItemIdList = useMemo(() => {
        if (popupMode === 'hidden') {
            return [];
        }
        const list = Object.values(itemMap).filter(item => {
            if (item.contents.length === 0) return false;

            // 非表示のものは無視する
            return isVisibleDataSource(item.id.dataSourceId);

        }).map(item => item.id)
        .filter(itemId => {
            // フィルタが掛かっている場合は条件外のものは除外する
            if (!filteredItemIdList) return true;
            return filteredItemIdList.some(filteredItemId => isEqualId(filteredItemId, itemId));
        });
        return list;
    }, [itemMap, popupMode, isVisibleDataSource, filteredItemIdList]);

    // 表示するポップアップ情報群
    const [popupGroups, setPopupGroups] = useState<PopupGroupWithPosition[]>([]);
    /**
     * 表示するポップアップ情報を更新する。
     * vectorSource.getFeatures()の結果の変更をReactで検知することはできないので、
     * useMemoではなくuseCallbackで実装している。
     */
    const updatePopupGroups = useCallback(async() => {
        const map = getMap();
        if (!map) return;
        const calculator = new PopupContainerCalculator(map, extent);
        calculator.setHasContentsItemIdList(hasContentsItemIdList);
        const popupGroups = await calculator.calculatePopupGroup();
        setPopupGroups(popupGroups);

    }, [getMap, hasContentsItemIdList, extent]);

    /**
     * 初期化処理。
     * 地図へのFeature追加検知して、表示するポップアップ情報を更新する。
     */
    useEffect(() => {
        const map = getMap();
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

    }, [getMap, updatePopupGroups]);

    /**
     * 表示対象コンテンツや表示エクステントが変わった契機でポップアップ情報更新
     */
    useWatch(() => {
        updatePopupGroups();
    }, [hasContentsItemIdList, extent]);

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

    const zoom = useSelector((state: RootState) => state.operation.mapView.zoom);
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
                stopEvent: true,
                element: elementRefMap.current[key],
            });
            getMap()?.addOverlay(overlay);
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
            getMap()?.removeOverlay(overlayRefMap.current[key]);
            delete overlayRefMap.current[key];
        });

    }, [getMap, popupGroups, zoom]);

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
