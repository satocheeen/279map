import { Overlay } from 'ol';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './LandNameOverlay.module.scss';
import { getMapKey } from '../../util/dataUtility';
import { useMap } from './useMap';
import { mapModeAtom, mapViewAtom } from '../../store/operation';
import { allItemsAtom } from '../../store/item';
import { useAtom } from 'jotai';
import { itemDataSourcesAtom } from '../../store/datasource';
import { ItemInfo, MapMode } from '../../types/types';
import { geoJsonToTurfPolygon } from '../../util/MapUtility';
import { bboxPolygon, centerOfMass, intersect } from '@turf/turf';
import { DatasourceLocationKindType, FeatureType } from '../../types-common/common-types';
import { useWatch } from '../../util/useWatch2';

// 島名を常時表示するズームLv.境界値（この値よりも小さい場合に、常時表示）
const LandNameShowZoomLv = 8.9;
const ForestNameShowZoomLv = 9.5;

export default function LandNameOverlay() {
    const [ dataSources ] = useAtom(itemDataSourcesAtom);
    const virtualItemDatasource = useMemo(() => {
        return dataSources.find(ds => ds.config.kind===DatasourceLocationKindType.VirtualItem);
    }, [dataSources]);

    const [ allItems ] = useAtom(allItemsAtom);
    const items = useMemo(() => {
        if (!virtualItemDatasource?.datasourceId) {
            return [];
        }
        return allItems.filter(item => virtualItemDatasource.datasourceId === item.datasourceId);
    }, [allItems, virtualItemDatasource]);

    const [mapView] = useAtom(mapViewAtom);
    const [ mapMode ] = useAtom(mapModeAtom);

    // 名前を持つ島
    const namedEarth = useMemo(() => {
        if (mapMode !== MapMode.Normal) {
            // 描画中は表示しない
            return [];
        }
        return Object.values(items).filter(item => {
            if (item.name.length === 0) {
                return false;
            }
            return [FeatureType.EARTH, FeatureType.FOREST].includes(item.geoProperties.featureType);
        });
    }, [items, mapMode]);

    // 表示範囲の島
    const currentAreaNamedEarth = useMemo(() => {
        // 表示範囲内の地物に絞る
        return namedEarth.filter(item => {
            const extentPolygon = bboxPolygon(mapView.extent as [number,number,number,number]);
            const itemPolygon = geoJsonToTurfPolygon(item.geometry);
            if (!itemPolygon) return false;
            return !!intersect(extentPolygon, itemPolygon);
        });
    }, [namedEarth, mapView.extent]);

    return (
        <React.Fragment>
            {
                currentAreaNamedEarth.map((item) => {
                    return (
                        <div key={getMapKey(item.id)}>
                            <LandName item={item} />
                        </div>
                    )
                })
            }
        </React.Fragment>
    );
}

type LandNameProps = {
    item: ItemInfo;
}
function LandName({ item }: LandNameProps) {
    const { map } = useMap();
    const [ mapView ] = useAtom(mapViewAtom);
    const landNameDivRef = useRef<HTMLDivElement|null>(null);
    const landNameOverlayRef = useRef<Overlay|undefined>();

    const isShow = useMemo(() => {
        if (!mapView.zoom) return false;

        if (item.geoProperties.featureType === FeatureType.EARTH) {
            return mapView.zoom < LandNameShowZoomLv;

        } else {
            return mapView.zoom > LandNameShowZoomLv && mapView.zoom < ForestNameShowZoomLv;
        }
    }, [mapView, item]);

    const [ fade, setFade ] = useState(false);
    useWatch(isShow, () => {
        setFade(true);
    })

    useEffect(() => {
        // オーバレイを配置する
        const element = landNameDivRef.current;
        if (element === undefined || element === null) {
            return;
        }
        const overlay = new Overlay({
            id: 'landname' + item.id,
            element,
            autoPan: false,
            autoPanAnimation: {
                duration: 250
            },
            className: styles.LandnameOverlayContainer,
        });

        const itemPolygon = geoJsonToTurfPolygon(item.geometry);
        const center = centerOfMass(itemPolygon);
        overlay.setPosition(center.geometry.coordinates);
        map?.addOverlay(overlay);            
        landNameOverlayRef.current = overlay;

        return () => {
            // 削除
            if (landNameOverlayRef.current) {
                console.log('removeOverlay')
                map?.removeOverlay(landNameOverlayRef.current);
            }
        }

    }, [item, map]);

    const visibleClass = useMemo(() => {
        if (isShow) {
            return styles.fadeIn;
        } else if (fade) {
            return styles.fadeOut;
        } else {
            return styles.Hide;
        }
    }, [isShow, fade]);

    return (
        <div className={`${styles.LandnameOverlay} ${visibleClass}`} ref={landNameDivRef}>
            {item.name}
        </div>
    )
}