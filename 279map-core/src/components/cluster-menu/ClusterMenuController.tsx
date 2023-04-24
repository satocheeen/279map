import { DataId, FeatureType } from '../../279map-common';
import { MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { useFilter } from '../../store/useFilter';
import ClusterMenu from './ClusterMenu';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { MapChartContext } from '../TsunaguMap/MapChart';

/**
 * 地図上のアイテムがクリックされた際に、
 * 必要に応じて重畳選択メニューを表示して、ユーザにアイテムを１つだけ選択させる。
 */

type Props = {
    // when set targets, user can select only the targets.
    targets?: FeatureType[];

    // callback when user select an item.
    onSelect?: (feature: Feature | undefined) => void;
}
type ClusterMenuTarget = {
    position: Coordinate;
    targets: Feature[];
}

export default function ClusterMenuController(props: Props) {
    const { map } = useContext(MapChartContext);
    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuTarget|null>(null);
    const { onClick } = useContext(OwnerContext);

    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const itemMapRef = useRef(itemMap);
    useEffect(() => {
        itemMapRef.current = itemMap;
    }, [itemMap]);

    const { filteredItemIdList } = useFilter();
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion
    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
    }, [filteredItemIdList]);

    /**
     * get the selectable features.
     * クリック位置付近に存在する選択可能な地物を返す
     * @params evt {MapBrowserEvent} 地図クリック時のイベント
     */
    const getSelectableFeatures = useCallback((evt: MapBrowserEvent<any>) => {
        // クリック位置付近にあるアイテムIDを取得
        let points = map.getNearlyFeatures(evt.pixel);

        if (props.targets) {
            // 対象種別指定されている場合は、対象種別のものに絞る
            points = points.filter(point => {
                const item = itemMapRef.current[point.getId() as string];
                if (!item) {
                    return false;
                }
                const featureType = item.geoProperties?.featureType;
                if (!featureType) {
                    return false;
                }
                return props.targets?.includes(featureType);
            });
        }

        // フィルタ時はフィルタ対象外のものに絞る
        if (filteredItemIdListRef.current) {
            points = points.filter(point => {
                return filteredItemIdListRef.current?.some(itemId => {
                    // TODO: data_source_id考慮
                    return point.getId() as string === itemId.id;
                });
            });
        }

        return points;
    }, [map, props.targets]);

    // イベントコールバック用意
    useEffect(() => {
        const clickFunc =  (evt: MapBrowserEvent<any>) => {
            setClusterMenuInfo(null);

            const points = getSelectableFeatures(evt);

            if (points.length === 0) {
                if (props.onSelect) {
                    props.onSelect(undefined);
                }
                return;
            }

            // show the cluseter menu when multiple items or the item has no contents
            // 対象が複数存在する場合またはコンテンツを持たないアイテムの場合は、重畳選択メニューを表示
            if (points.length === 1) {
                const item = itemMapRef.current[points[0].getId() as string];
                if (item.contents.length === 0) {
                    setClusterMenuInfo({
                        position: evt.coordinate,
                        targets: points,
                    });
                    return;
                }
                if (props.onSelect) {
                    props.onSelect(points[0]);
                } 
            } else if (!onClick) {
                // onClick指定時は、重畳選択メニューは表示しない
                setClusterMenuInfo({
                    position: evt.coordinate,
                    targets: points,
                });
            }
            if (onClick) {
                // onClick指定時は、クリックされたアイテムのID一覧を返す（重畳選択メニューは表示しない）
                const ids = points.map((p): DataId => {
                    return {
                        id: p.getId() as string,
                        dataSourceId: '',   // TODO: dataSourceID考慮
                    };
                });
                onClick(ids);
            }

        };
        map.on('click', clickFunc);

        // クリック可能な地図上アイテムhover時にポインター表示
        const pointerMoveFunc = (evt: MapBrowserEvent<any>) => {
            const points = getSelectableFeatures(evt);

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
        // TODO: dataSourceId考慮
        const target = clusterMenuInfo?.targets.find(target => target.getId() === id.id);
        if (target && props.onSelect) {
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
            itemIds={clusterMenuInfo.targets.map(target => {
                return {
                    id: target.getId() as string,
                    dataSourceId: '',   // TODO: dataSourceId
                } as DataId
            })}
            onSelect={onClusterMenuSelected}
            onClose={onClusterMenuClosed} />
);
}