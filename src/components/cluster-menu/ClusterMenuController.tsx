import { Map, MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import Feature, { FeatureLike } from 'ol/Feature';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFilter } from '../../store/useFilter';
import ClusterMenu from './ClusterMenu';

type Props = {
    map: Map;
    onSelect?: (feature: FeatureLike | undefined) => void;
    showAddContentMenu?: boolean;   // when true, show the add content menu button when the item has no contents.
}
type ClusterMenuTarget = {
    position: Coordinate;
    targets: FeatureLike[];
}

/**
 * 地図上のアイテムがクリックされた際に、
 * 必要に応じて重畳選択メニューを表示して、ユーザにアイテムを１つだけ選択させる。
 * @param props 
 * @returns 
 */
export default function ClusterMenuController(props: Props) {
    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuTarget|null>(null);

    const { filteredItemIdList } = useFilter();
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion
    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
    }, [filteredItemIdList]);

    useEffect(() => {
        const clickFunc =  (evt: MapBrowserEvent<any>) => {
            setClusterMenuInfo(null);
            // クリック位置付近にあるアイテムIDを取得
            let points = [] as FeatureLike[];
            props.map.forEachFeatureAtPixel(evt.pixel, (f) => {
                const id = f.getId() as string | undefined;
                if (id !== undefined) {
                    points.push(f);
                    return;
                }
                const features = f.get('features');
                if (!features) {
                    return;
                }
                (features as Feature[]).forEach(feature => {
                    const id = feature.getId() as string | undefined;
                    if (id !== undefined) {
                        points.push(feature);
                    }
                });
            });
            // フィルタ時はフィルタ対象外のものに絞る
            if (filteredItemIdListRef.current) {
                points = points.filter(point => filteredItemIdListRef.current?.includes(point.getId() as string));
            }

            if (points.length === 0) {
                if (props.onSelect) {
                    props.onSelect(undefined);
                }
                return;
            } else if (points.length === 1) {
                if (props.onSelect) {
                    props.onSelect(points[0]);
                } 
                return;
            }

            // show the cluseter menu when multiple items or the item has no contents
            // 対象が複数存在する場合またはコンテンツを持たないアイテムの場合は、重畳選択メニューを表示
            setClusterMenuInfo({
                position: evt.coordinate,
                targets: points,
            });
        };
        
        props.map.on('click', clickFunc);

        return () => {
            props.map.un('click', clickFunc);
        }

    }, [props]);

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