import { Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useContext, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { getFeatureCenter } from '../../util/MapUtility';
import usePointStyle from '../map/usePointStyle';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { MapChartContext } from '../TsunaguMap/MapChart';
import { DataId } from '../../279map-common';
import { convertDataIdFromFeatureId, getMapKey, isEqualId } from '../../store/data/dataUtility';
import { LayerType } from '../TsunaguMap/VectorLayerMap';

type PopupGroup = {
    mainFeature: Feature;
    itemIds: DataId[];  // ポップアップに紐づくアイテムID一覧
}

type PopupGroupWithPosition = {
    itemPositions: GeolibInputCoordinates[];    // ポップアップ表示位置
    itemIds: DataId[];  // ポップアップに紐づくアイテムID一覧
}
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

    const ownerContext = useContext(OwnerContext);

    const { map } = useContext(MapChartContext);
    const { pointStyleFunction } = usePointStyle();

    const [ loadendFlag, setLoadendFlag ] = useState(0);
    const [ addfeatureFlag, setAddfeatureFlag ] = useState(0);
    useEffect(() => {
        // 画像ロード完了していないと、imagePositionの取得に失敗するので、ここでイベント検知して再描画させる
        const loadendFunc = () => {
            console.log('loadend');
            setLoadendFlag((val) => {
                return val + 1
            });
        }
        map.once('loadend', loadendFunc);

        const itemLayers = map.getLayersOfTheType(LayerType.Point);
        const addfeatureFunc = () => {
            console.log('add feature');
            setAddfeatureFlag((val) => val + 1);
        }
        itemLayers.forEach(itemLayer => {
            const source = itemLayer.layer.getSource() as VectorSource;
            source.on('addfeature', addfeatureFunc);
        });

        return () => {
            map.un('loadend', loadendFunc);
            itemLayers.forEach(itemLayer => {
                const source = itemLayer.layer.getSource() as VectorSource;
                source.un('addfeature', addfeatureFunc);
            });
        }

    }, [map]);

    // コンテンツを持つアイテムID一覧
    const hasContentsItemIdList = useMemo(() => {
        if (ownerContext.disabledPopup) {
            return [];
        }
        console.log('itemMap', itemMap);
        const list = Object.values(itemMap).filter(item => item.contents.length>0).map(item => item.id);
        console.log('hasContentsItemIdList', list);
        return list;
    }, [itemMap, ownerContext.disabledPopup]);

    const popupGroups = useMemo((): PopupGroup[] => {
        /**
         * 建物orピンのポップアップ情報を返す
         */
        const itemPopupInfos = function(): PopupGroup[] {
            const itemSources = map.getLayersOfTheType(LayerType.Point).map(layerInfo => {
                return layerInfo.layer.getSource() as VectorSource;
            });
            if (itemSources.length === 0) return [];

            const popupInfoList = [] as PopupGroup[];
            itemSources.forEach(itemSource => {
                itemSource.getFeatures().forEach(feature => {
                    const features = feature.get('features') as Feature[];
    
                    // コンテンツを持つアイテムに絞る
                    const itemIds = features.map((f): DataId => {
                        const id = convertDataIdFromFeatureId(f.getId() as string);
                        return id;
                    }).filter(id => {
                        return hasContentsItemIdList.some(item => isEqualId(item, id));
                    });
                    if (itemIds.length === 0) {
                        return;
                    }
    
                    popupInfoList.push({
                        mainFeature: features[0],
                        itemIds,
                    })
                });
            });

            console.log('itemPopupInfos', popupInfoList);
            return popupInfoList;
        }();

        /**
         * エリアのポップアップ情報を返す
         */
        const areaPopupInfo = function(): PopupGroup[] {
            const areaSources = map.getLayersOfTheType(LayerType.Topography).map(layerInfo => layerInfo.layer.getSource() as VectorSource);
            if (areaSources.length === 0) return [];
            const popupInfoList = [] as PopupGroup[]; 
            areaSources.forEach(source => {
                source.getFeatures().forEach(feature => {
                    // コンテンツを持つアイテムに絞る
                    const id = convertDataIdFromFeatureId(feature.getId() as string);
                    if (!hasContentsItemIdList.some(item => isEqualId(item, id))) {
                        return;
                    }
    
                    popupInfoList.push({
                        mainFeature: feature,
                        itemIds: [id],
                    })
                });
            })

            return popupInfoList;

        }();

        const infos = itemPopupInfos.concat(areaPopupInfo);

        return infos;
    // vectorSource.getFeatures()の結果が変わるので、addfeatureFlagを依存関係に入れている
    }, [map, hasContentsItemIdList, addfeatureFlag]);

    /**
     * ポップアップ表示位置設定
     */
    const [ regetPositionFlag, setRegetPositionFlag ] = useState(false);  // 画像ロード未完了のために位置取得できない場合に、時間を置いて再度位置取得するためのフラグ
    const popupGroupWithPosition = useMemo((): PopupGroupWithPosition[] => {
        const getPopupPosition = (feature: Feature): undefined | { longitude: number; latitude: number; } => {
            // -- 中心位置取得
            const itemPosition = getFeatureCenter(feature);
            if (!itemPosition) {
                console.log('getFeatureCenter undefined')
                return;
            }

            if (feature.getGeometry()?.getType() === 'Point') {
                // 建物orピンの場合、アイコンの上部にポップアップを表示する
                const style = pointStyleFunction(feature, map.currentResolution);
                const image = style.getImage();
                const pixel = map.getPixelFromCoordinate([itemPosition.longitude, itemPosition.latitude]);
                const imageSize = image.getSize();
                if (!imageSize || imageSize.length < 2 || !pixel || pixel.length < 2) {
                    console.log('imageSize undefined', image, imageSize);
                    return;
                }

                pixel[1] = pixel[1] - imageSize[1] * (image.getScale() as number);
                const newPosition = map.getCoordinateFromPixel(pixel);
                itemPosition.latitude = newPosition[1];
    
            }

            return itemPosition;    
        };
        
        const result = [] as PopupGroupWithPosition[];
        let retryFlag = false;
        for (const popupGroup of popupGroups) {
            const itemPosition = getPopupPosition(popupGroup.mainFeature);
            if (!itemPosition) {
                console.log('get position retry');
                retryFlag = true;
                continue;
            }
            result.push({
                itemPositions: [itemPosition],
                itemIds: popupGroup.itemIds,
            });
        }
        if (retryFlag) {
            setTimeout(() => {
                setRegetPositionFlag(true);
            }, 100);
        } else {
            setRegetPositionFlag(false);
        }
        return result;
    }, [map, popupGroups, regetPositionFlag, pointStyleFunction]);

    // 開閉時に、zIndexを最前面に
    useEffect(() => {
        // const isOpen = (target: PopupInfo) => {
        //     return target.itemIds.some(itemId => {
        //         return openedPopupItemIds.includes(itemId);
        //     });
        // }
        popupGroupWithPosition.forEach(target => {
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
    }, [/* openedPopupItemIds, */popupGroupWithPosition]);

    const zoom = useSelector((state: RootState) => state.operation.mapView.zoom);
    useEffect(() => {
        // 新しく追加されたものについて、オーバレイを配置する
        const addChildren = popupGroupWithPosition.filter(target => {
            const exist = Object.keys(overlayRefMap.current).some(key => key === createKeyFromPopupInfo(target));
            return !exist;
        });

        console.log('addChildren', addChildren);
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
            map.addOverlay(overlay);
            overlay.setPosition([position.longitude, position.latitude]);
            overlayRefMap.current[key] = overlay;
        });

        // 位置更新されたもについて位置を更新する
        const updateChildren = popupGroupWithPosition.filter(target => {
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
            const exist = popupGroupWithPosition.some(target => {
                return key === createKeyFromPopupInfo(target)
            });
            return !exist;
        });
        removeChildren.forEach(key => {
            map.removeOverlay(overlayRefMap.current[key]);
            delete overlayRefMap.current[key];
        });

    }, [map, popupGroupWithPosition, zoom]);

    return (
        <>
            {
                popupGroupWithPosition.map(target => {
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
