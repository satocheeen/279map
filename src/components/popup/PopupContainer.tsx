import { Map, Overlay } from 'ol';
import React, { useEffect, useRef, useMemo, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import PointsPopup from './PointsPopup';
import { getCenter } from 'geolib';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { getFeatureByItemId, getGeoJsonCenter } from '../../util/MapUtility';
import usePointStyle from '../map/usePointStyle';
import usePopup from './usePopup';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

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
    const forceItemIds = useSelector((state: RootState) => 
        state.operation.popupTargets.filter(target => {
            return target.type === 'item' && target.force;
        }).map(target => target.type === 'item' ? target.itemId : '')
    );

    const ownerContext = useContext(OwnerContext);

    // ポップアップ表示対象のコンテンツを持つアイテムID一覧
    const hasContentsItemIdList = useMemo(() => {
        if (ownerContext.disabledPopup) {
            return [];
        }
        const list = Object.values(itemMap).filter(item => item.contentId).map(item => item.id);
        // コンテンツなくても強制表示するものを追加
        forceItemIds.forEach(id => {
            if (list.indexOf(id) === -1) {
                list.push(id);
            }
        });
        return list;
    }, [itemMap, forceItemIds, ownerContext.disabledPopup]);

    const { getStructureStyleFunction } = usePointStyle({});

    const popupInfos = useMemo((): PopupInfo[] => {
        // アイテムごとに表示位置決定
        const list = [] as PopupInfo[];

        hasContentsItemIdList.forEach((itemId) => {
            const item = itemMap[itemId];
            const feature = getFeatureByItemId(props.map, itemId);

            if (!item || !feature) {
                // アイテム未ロードのものは、ひとまず無視 TODO: もしかしたらアイテムロードするようにした方がいいかも？
                return;
            }
            if (item.position.type !== 'geoJson') {
                // TODO: GPX対応
                return;
            }
            
            // 表示位置決定
            // -- 中心位置取得
            const itemPosition = getGeoJsonCenter(item.position.geoJson);
            if (!itemPosition) {
                return;
            }
            // -- Pointの場合はシンボルの上部位置にする
            if (feature.getGeometry()?.getType() === 'Point') {
                const adjust = function(){
                    const style = getStructureStyleFunction()(feature, props.map.getView().getResolution() ?? 0);
                    const image = style.getImage();
                    const pixel = props.map.getPixelFromCoordinate([itemPosition.longitude, itemPosition.latitude]);
                    const imageSize = image.getSize();
                    if (!imageSize || imageSize.length < 2 || !pixel || pixel.length < 2) {
                        return;
                    }

                    pixel[1] = pixel[1] - imageSize[1] * (image.getScale() as number);
                    const newPosition = props.map.getCoordinateFromPixel(pixel);
                    itemPosition.latitude = newPosition[1];
                };
                adjust();
            }

            // --位置が近いものはまとめる
            const nearItem = list.find(listItem => {
                const center = getCenter(listItem.itemPositions);
                if (!center) {
                    return false;
                }
                // 距離をピクセルで算出
                const pixel1 = props.map.getPixelFromCoordinate([center.longitude, center.latitude]);
                const pixel2 = props.map.getPixelFromCoordinate([itemPosition.longitude, itemPosition.latitude]);
                if (!pixel1 || !pixel2) {
                    return false;
                }
                const d = Math.sqrt(Math.pow(pixel1[0] - pixel2[0], 2) + Math.pow(pixel1[1] - pixel2[1], 2));
                // TODO: ポップアップが開いているかどうかで、条件変更
                return d < 30; // 指定pixel以内の距離にあるものはまとめる
            });
            if (nearItem) {
                nearItem.itemIds.push(itemId);
                nearItem.itemPositions.push(itemPosition);
            } else {
                list.push({
                    itemPositions: [itemPosition],
                    itemIds: [itemId],
                });
            }
        });
        return list;

    }, [hasContentsItemIdList, itemMap, props.map, getStructureStyleFunction]);

    const { openedPopupItemIds } = usePopup();
    // 開閉時に、zIndexを最前面に
    useEffect(() => {
        const isOpen = (target: PopupInfo) => {
            return target.itemIds.some(itemId => {
                return openedPopupItemIds.includes(itemId);
            });
        }
        popupInfos.forEach(target => {
            const key = createKeyFromPopupInfo(target);
            const ele = elementRefMap.current[key]?.parentElement;
            const open = isOpen(target);
            console.log('open', open);
            if(open) {
                if (ele)
                    ele.style.zIndex = '10';
            } else {
                if (ele)
                    ele.style.zIndex = '0';
            }
        });
    }, [openedPopupItemIds, popupInfos]);

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
            props.map.addOverlay(overlay);
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
            props.map.removeOverlay(overlayRefMap.current[key]);
            delete overlayRefMap.current[key];
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
