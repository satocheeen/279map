import { MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import React, { useRef, useEffect, useState, useCallback, useContext, useImperativeHandle } from 'react';
import ClusterMenu from './ClusterMenu';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { usePrevious } from '../../util/usePrevious';
import { isEqualId } from '../../util/dataUtility';
import { useMap } from '../map/useMap';
import { mapModeAtom, mapViewAtom, showingDetailItemIdAtom } from '../../store/operation';
import { filteredItemIdListAtom } from '../../store/filter';
import { useItems } from '../../store/item/useItems';
import { useAtom } from 'jotai';
import { DataId, FeatureType } from '../../graphql/generated/graphql';

/**
 * 地図上のアイテムがクリックされた際に、
 * 必要に応じて重畳選択メニューを表示して、ユーザにアイテムを１つだけ選択させる。
 */

type Props = {
    // when set targets, user can select only the targets.
    targets?: FeatureType[];

    // callback when user select an item.
    onSelect: (id: DataId | undefined) => void;
}
type ClusterMenuTarget = {
    position: Coordinate;
    targets: DataId[];
}
export type ClusterMenuControllerHandler = {
    showClusterMenu: (param: {position: Coordinate; targets: DataId[]}) => void;
}
function ClusterMenuController(props: Props, ref: React.ForwardedRef<ClusterMenuControllerHandler>) {
    const { map } = useMap();
    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuTarget|null>(null);
    const { onClick } = useContext(OwnerContext);
    const [mapMode] = useAtom(mapModeAtom);

    const [filteredItemIdList] = useAtom(filteredItemIdListAtom);
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion

    useImperativeHandle(ref, () => ({
        showClusterMenu(param) {
            // 外部コンポーネントから重畳選択メニュー表示命令された場合
            setClusterMenuInfo(param);
        },
    }))

    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
    }, [filteredItemIdList]);

    useEffect(() => {
        setClusterMenuInfo(null);
    }, [mapMode]);

    // close cluster menu when zoom level is changed
    const [mapView] = useAtom(mapViewAtom);
    const prevMapView = usePrevious(mapView);
    useEffect(() => {
        if (mapView.zoom === prevMapView?.zoom) {
            return;
        }
        setClusterMenuInfo(null);
    }, [mapView, prevMapView]);

    const [selectedItemId] = useAtom(showingDetailItemIdAtom);
    useEffect(() => {
        if (selectedItemId) {
            setClusterMenuInfo(null);
        }
    }, [selectedItemId]);

    const { getItem } = useItems();
    /**
     * get the selectable features.
     * クリック位置付近に存在する選択可能な地物を返す
     * @params evt {MapBrowserEvent} 地図クリック時のイベント
     */
    const getSelectableFeatures = useCallback(async(evt: MapBrowserEvent<any>) => {
        if (!map) return [];
        // クリック位置付近にあるアイテムIDを取得
        let pointIds = map.getNearlyFeatures(evt.pixel);

        if (props.targets) {
            // 対象種別指定されている場合は、対象種別のものに絞る
            const filterResults = await Promise.all(pointIds.map(async(point) => {
                const item = getItem(point.id);
                if (!item) {
                    return false;
                }
                const featureType = item.geoProperties?.featureType;
                if (!featureType) {
                    return false;
                }
                return props.targets?.includes(featureType) ?? false;
            }));
            pointIds = pointIds.filter((_, i) => filterResults[i]);
        }

        // フィルタ時はフィルタ対象外のものに絞る
        if (filteredItemIdListRef.current) {
            pointIds = pointIds.filter(point => {
                return filteredItemIdListRef.current?.some(itemId => {
                    return isEqualId(point.id, itemId);
                });
            });
        }

        return pointIds;
    }, [map, props.targets, getItem]);

    // イベントコールバック用意
    useEffect(() => {
        if (!map) return;
        const clickFunc =  async(evt: MapBrowserEvent<any>) => {
            setClusterMenuInfo(null);

            const pointIds = await getSelectableFeatures(evt);

            if (pointIds.length === 0) {
                props.onSelect(undefined);
                return;
            }

            // show the cluseter menu when multiple items or the item has no contents
            // 対象が複数存在する場合は、重畳選択メニューを表示
            if (pointIds.length === 1) {
                props.onSelect(pointIds[0].id);
            } else if (!onClick) {
                // onClick指定時は、重畳選択メニューは表示しない
                setClusterMenuInfo({
                    position: evt.coordinate,
                    targets: pointIds.map(p=>p.id),
                });
            }
            if (onClick) {
                // onClick指定時は、クリックされたアイテムのID一覧を返す（重畳選択メニューは表示しない）
                onClick(pointIds.map(p=>p.id));
            }

        };
        map.on('click', clickFunc);

        // クリック可能な地図上アイテムhover時にポインター表示
        const pointerMoveFunc = async(evt: MapBrowserEvent<any>) => {
            const points = await getSelectableFeatures(evt);

            // const isHover = hitIds.some(id => isTarget(id));
            if (points.length > 0) {
                map.setCursorStyle('pointer');
            } else {
                map.setCursorStyle('');
            }
        }
        map.on('pointermove', pointerMoveFunc);

        return () => {
            map.un('click', clickFunc);
            map.un('pointermove', pointerMoveFunc);
        }

    }, [props, getSelectableFeatures, onClick, map]);

    /**
     * 重畳選択メニュー選択時のコールバック
     */
    const onClusterMenuSelected = useCallback((id: DataId) => {
        const target = clusterMenuInfo?.targets.find(target => isEqualId(target, id));
        if (target) {
            props.onSelect(target);
        }
        setClusterMenuInfo(null);
    }, [props, clusterMenuInfo]);

    /**
     * 重畳選択メニューのコンテンツ追加メニュークリック時など
     * 重畳選択メニューを閉じる場合のコールバック
     */
    const onClusterMenuClosed = useCallback(() => {
        setClusterMenuInfo(null);
    }, []);

    if (!clusterMenuInfo) {
        return null;
    }

    return (
        <ClusterMenu
            position={clusterMenuInfo.position}
            itemIds={clusterMenuInfo.targets}
            onSelect={onClusterMenuSelected}
            onClose={onClusterMenuClosed} />
    );
}
export default React.forwardRef(ClusterMenuController);
