import { FeatureType } from '279map-common';
import { Map, MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { useFilter } from '../../store/useFilter';
import ClusterMenu from './ClusterMenu';

/**
 * 地図上のアイテムがクリックされた際に、
 * 必要に応じて重畳選択メニューを表示して、ユーザにアイテムを１つだけ選択させる。
 */

type Props = {
    map: Map;

    // when set targets, user can select only the targets.
    targets?: FeatureType[];

    // callback when user select an item.
    onSelect?: (feature: Feature | undefined) => void;

    // when true, show the add content menu button when the item has no contents.
    showAddContentMenu?: boolean;
}
type ClusterMenuTarget = {
    position: Coordinate;
    targets: Feature[];
}

export default function ClusterMenuController(props: Props) {
    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuTarget|null>(null);

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
        let points = [] as Feature[];
        props.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            const layerName = layer.getProperties()['name'];
            if (layerName === 'itemLayer') {
                const features = feature.get('features') as Feature[];
                features.forEach(f => {
                    points.push(f);
                });
            } else if(layerName === 'topographyLayer') {
                points.push(feature as Feature);
            }
        });

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
            points = points.filter(point => filteredItemIdListRef.current?.includes(point.getId() as string));
        }

        return points;
    }, [props.map, props.targets]);

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
                if (props.showAddContentMenu && !item.contents) {
                    setClusterMenuInfo({
                        position: evt.coordinate,
                        targets: points,
                    });
                } else if (props.onSelect) {
                    props.onSelect(points[0]);
                } 
            } else {
                setClusterMenuInfo({
                    position: evt.coordinate,
                    targets: points,
                });
            }

        };
        props.map.on('click', clickFunc);

        // クリック可能な地図上アイテムhover時にポインター表示
        const pointerMoveFunc = (evt: MapBrowserEvent<any>) => {
            const points = getSelectableFeatures(evt);

            // const isHover = hitIds.some(id => isTarget(id));
            if (points.length > 0) {
                props.map.getTargetElement().style.cursor = 'pointer';
            } else {
                props.map.getTargetElement().style.cursor = '';
            }
        }
        props.map.on('pointermove', pointerMoveFunc);

        return () => {
            props.map.un('click', clickFunc);
            props.map.un('pointermove', pointerMoveFunc);
        }

    }, [props, getSelectableFeatures]);

    const onClusterMenuSelected = useCallback((id: string) => {
        const target = clusterMenuInfo?.targets.find(target => target.getId() === id);
        if (target && props.onSelect) {
            props.onSelect(target);
        }
        setClusterMenuInfo(null);
    }, [props, clusterMenuInfo]);

    if (!clusterMenuInfo) {
        return null;
    }

    return (
        <ClusterMenu map={props.map} showAddContentMenu={props.showAddContentMenu}
            position={clusterMenuInfo.position}
            itemIds={clusterMenuInfo.targets.map(target => target.getId() as string)}
            onSelect={onClusterMenuSelected} />
);
}