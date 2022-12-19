import { Map, Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { getFeatureCenter } from '../../util/MapUtility';
import usePointStyle from '../map/usePointStyle';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import VectorSource from 'ol/source/Vector';
import { FeatureLike } from 'ol/Feature';

type Props = {
    map: Map;
}
type PopupInfo = {
    itemPositions: GeolibInputCoordinates[];    // ポップアップ表示位置
    itemIds: string[];  // ポップアップに紐づくアイテムID一覧
}
function createKeyFromPopupInfo(param: PopupInfo): string {
    if (!param) {
        return '';
    }
    return param.itemIds.join(',');
}
export default function PopupContainer(props: Props) {
    const elementRefMap = useRef<{ [key: string]: HTMLDivElement }>({});
    const overlayRefMap = useRef<{ [key: string]: Overlay }>({});

    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const ownerContext = useContext(OwnerContext);
    const mapRef = useRef(props.map);

    // コンテンツを持つアイテムID一覧
    const hasContentsItemIdList = useMemo(() => {
        if (ownerContext.disabledPopup) {
            return [];
        }
        const list = Object.values(itemMap).filter(item => item.contents).map(item => item.id);
        return list;
    }, [itemMap, ownerContext.disabledPopup]);

    const { getStructureStyleFunction } = usePointStyle({});

    const getPopupPosition = useCallback((feature: FeatureLike): undefined | { longitude: number; latitude: number; } => {
            // -- 中心位置取得
            const itemPosition = getFeatureCenter(feature);
            if (!itemPosition) {
                return;
            }

            if (feature.getGeometry()?.getType() === 'Point') {
                // 建物orピンの場合、アイコンの上部にポップアップを表示する
                const style = getStructureStyleFunction()(feature, mapRef.current.getView().getResolution() ?? 0);
                const image = style.getImage();
                const pixel = mapRef.current.getPixelFromCoordinate([itemPosition.longitude, itemPosition.latitude]);
                const imageSize = image.getSize();
                console.log('imageSize', imageSize);
                if (!imageSize || imageSize.length < 2 || !pixel || pixel.length < 2) {
                    return;
                }

                pixel[1] = pixel[1] - imageSize[1] * (image.getScale() as number);
                const newPosition = mapRef.current.getCoordinateFromPixel(pixel);
                itemPosition.latitude = newPosition[1];
            }

            return itemPosition;

    }, [getStructureStyleFunction]);

    /**
     * 建物orピンのポップアップ情報を返す
     */
    const itemPopupInfos = useMemo((): PopupInfo[] => {
        const itemLayer = mapRef.current.getAllLayers().find(layer => layer.getProperties()['name'] === 'itemLayer');
        if (!itemLayer) return [];

        const source = itemLayer.getSource() as VectorSource;
        const popupInfoList = [] as PopupInfo[]; 
        source.getFeatures().forEach(feature => {
            const features = feature.get('features') as FeatureLike[];

            // コンテンツを持つアイテムに絞る
            const itemIds = features.map(f => f.getId() as string).filter(id => {
                return hasContentsItemIdList.includes(id);
            });
            if (itemIds.length === 0) {
                return;
            }

            const itemPosition = getPopupPosition(features[0]);
            if (!itemPosition) {
                return;
            }

            popupInfoList.push({
                itemPositions: [itemPosition],
                itemIds,
            })
        });

        return popupInfoList;
    }, [hasContentsItemIdList, getPopupPosition]);

    /**
     * エリアのポップアップ情報を返す
     */
    const areaPopupInfo = useMemo((): PopupInfo[] => {
        const areaLayer = mapRef.current.getAllLayers().find(layer => layer.getProperties()['name'] === 'topographyLayer');
        if (!areaLayer) return [];
        const source = areaLayer.getSource() as VectorSource;
        const popupInfoList = [] as PopupInfo[]; 
        source.getFeatures().forEach(feature => {
            // コンテンツを持つアイテムに絞る
            const id = feature.getId() as string;
            if (!hasContentsItemIdList.includes(id)) {
                return;
            }

            const itemPosition = getPopupPosition(feature);
            if (!itemPosition) {
                return;
            }

            popupInfoList.push({
                itemPositions: [itemPosition],
                itemIds: [id],
            })
        });

        return popupInfoList;

    }, [hasContentsItemIdList, getPopupPosition]);

    const popupInfos = useMemo((): PopupInfo[] => {
        return itemPopupInfos.concat(areaPopupInfo);
    }, [itemPopupInfos, areaPopupInfo]);

    // 開閉時に、zIndexを最前面に
    useEffect(() => {
        // const isOpen = (target: PopupInfo) => {
        //     return target.itemIds.some(itemId => {
        //         return openedPopupItemIds.includes(itemId);
        //     });
        // }
        popupInfos.forEach(target => {
            const key = createKeyFromPopupInfo(target);
            const ele = elementRefMap.current[key]?.parentElement;
            // const open = isOpen(target);
            const open = true;
            console.log('open', open);
            if(open) {
                if (ele)
                    ele.style.zIndex = '10';
            } else {
                if (ele)
                    ele.style.zIndex = '0';
            }
        });
    }, [/* openedPopupItemIds, */popupInfos]);

    const zoom = useSelector((state: RootState) => state.operation.mapView.zoom);
    useEffect(() => {
        // 新しく追加されたものについて、オーバレイを配置する
        const addChildren = popupInfos.filter(target => {
            const exist = Object.keys(overlayRefMap.current).some(key => key === createKeyFromPopupInfo(target));
            return !exist;
        });

        addChildren.forEach(target => {
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
            mapRef.current.addOverlay(overlay);
            overlay.setPosition([position.longitude, position.latitude]);
            overlayRefMap.current[key] = overlay;
        });

        // 位置更新されたもについて位置を更新する
        const updateChildren = popupInfos.filter(target => {
            const exist = Object.keys(overlayRefMap.current).some(key => key === createKeyFromPopupInfo(target));
            return exist;
        });
        updateChildren.forEach(target => {
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
            const exist = popupInfos.some(target => {
                return key === createKeyFromPopupInfo(target)
            });
            return !exist;
        });
        removeChildren.forEach(key => {
            mapRef.current.removeOverlay(overlayRefMap.current[key]);
            delete overlayRefMap.current[key];
        });

    }, [popupInfos, zoom]);

    return (
        <>
            {
                popupInfos.map(target => {
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
