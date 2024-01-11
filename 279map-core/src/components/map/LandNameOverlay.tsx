import { Overlay } from 'ol';
import React, { useEffect, useMemo, useRef } from 'react';
import styles from './LandNameOverlay.module.scss';
import { getMapKey, isEqualId } from '../../util/dataUtility';
import { useMap } from './useMap';
import { mapModeAtom, mapViewAtom } from '../../store/operation';
import { allItemsAtom } from '../../store/item';
import { useAtom } from 'jotai';
import { itemDataSourcesAtom } from '../../store/datasource';
import { ItemInfo, MapMode } from '../../types/types';
import { geoJsonToTurfPolygon } from '../../util/MapUtility';
import { bboxPolygon, booleanContains, centerOfMass } from '@turf/turf';
import { DatasourceKindType } from '../../graphql/generated/graphql';
import { FeatureType } from '../../types-common/common-types';

// 島名を常時表示するズームLv.境界値（この値よりも小さい場合に、常時表示）
const LandNameShowZoomLv = 8.17

export default function LandNameOverlay() {
    const { map } = useMap();
    const [ dataSources ] = useAtom(itemDataSourcesAtom);
    const virtualItemDatasource = useMemo(() => {
        return dataSources.find(ds => ds.kind===DatasourceKindType.Item);
    }, [dataSources]);

    const [ allItems ] = useAtom(allItemsAtom);
    const items = useMemo(() => {
        if (!virtualItemDatasource?.datasourceId) {
            return [];
        }
        return allItems[virtualItemDatasource.datasourceId] ?? [];
    }, [allItems, virtualItemDatasource]);

    const landNameDivMapRef = useRef({} as { [id: string]: HTMLDivElement });
    const landNameOverlayMapRef = useRef({} as  { [id: string]: Overlay });

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
            return item.geoProperties.featureType === FeatureType.EARTH;
        });
    }, [items, mapMode]);

    // 表示範囲の島
    const currentAreaNamedEarth = useMemo(() => {
        // 表示範囲内の地物に絞る
        return namedEarth.filter(item => {
            const extentPolygon = bboxPolygon(mapView.extent as [number,number,number,number]);
            const itemPolygon = geoJsonToTurfPolygon(item.geoJson);
            if (!itemPolygon) return false;
            return booleanContains(extentPolygon, itemPolygon);
        });
    }, [namedEarth, mapView.extent]);

    // 現在オーバーレイ表示中のアイテム一覧
    const currentOverlayItemRef = useRef<ItemInfo[]>([]);

    // 島名の付与された島に変更があった場合
    useEffect(() => {
        // オーバレイを配置する
        currentAreaNamedEarth.forEach(item => {
            const exist = currentOverlayItemRef.current.some(prev => isEqualId(prev.id, item.id));
            if (exist) return;

            // 追加
            const element = landNameDivMapRef.current[getMapKey(item.id)];
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

            const itemPolygon = geoJsonToTurfPolygon(item.geoJson);
            const center = centerOfMass(itemPolygon);
            overlay.setPosition(center.geometry.coordinates);
            map?.addOverlay(overlay);            
            landNameOverlayMapRef.current[getMapKey(item.id)] = overlay;
        });

        currentOverlayItemRef.current.forEach(item => {
            const exist = currentAreaNamedEarth.some(cur => isEqualId(cur.id, item.id));
            if (exist) return;

            // 削除
            const overlay = landNameOverlayMapRef.current[getMapKey(item.id)];
            map?.removeOverlay(overlay);
        });
        currentOverlayItemRef.current = currentAreaNamedEarth.concat();
    }, [currentAreaNamedEarth, map]);

    const fadeClass = useMemo(() => {
        if (!mapView.zoom) return null;
        const isLandNameFade = mapView.zoom > LandNameShowZoomLv;
        return isLandNameFade ? styles.fadeOut : "";
    }, [mapView]);

    return (
        <React.Fragment>
            {
                currentAreaNamedEarth.map((item) => {
                    return (
                        <div key={getMapKey(item.id)}>
                            <div className={`${styles.LandnameOverlay} ${fadeClass}`} ref={ref => landNameDivMapRef.current[getMapKey(item.id)] = ref as HTMLDivElement}>
                                {item.name}
                            </div>
                        </div>
                    )
                })
            }
        </React.Fragment>
    );
}