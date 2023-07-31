import { Overlay } from 'ol';
import React, { useEffect, useMemo, useState } from 'react';
import {buffer, getSize} from 'ol/extent';
import { usePrevious } from '../../util/usePrevious';
import styles from './LandNameOverlay.module.scss';
import { FeatureType } from '279map-common';
import { getMapKey } from '../../util/dataUtility';
import { useMap } from './useMap';
import { itemMapState } from '../../store/item';
import { useRecoilValue } from 'recoil';
import { mapViewState } from '../../store/operation';

// 島名を常時表示するズームLv.境界値（この値よりも小さい場合に、常時表示）
const LandNameShowZoomLv = 8.17

export default function LandNameOverlay() {
    const { getMap } = useMap();
    const itemMap = useRecoilValue(itemMapState);

    const [landNameRefMap] = useState({} as { [id: string]: HTMLDivElement });
    const [landNameOverlayMap] = useState({} as  { [id: string]: Overlay });

    const mapView = useRecoilValue(mapViewState);

    // 名前を持つ島
    const namedEarth = useMemo(() => {
        return Object.values(itemMap).filter(item => {
            if (item.name.length === 0) {
                return false;
            }
            return item.geoProperties?.featureType === FeatureType.EARTH;
        });
    }, [itemMap]);

    // 表示範囲の島
    const currentAreaNamedEarth = useMemo(() => {
        // 表示範囲内の地物に絞る
        return namedEarth.filter(item => {
            const feature = getMap()?.getFeatureById(item.id);
            if (!feature) {
                return false;
            }
            const geometry = feature.getGeometry();
            if (!geometry) {
                return false;
            }
            // --表示範囲よりも少し内側に入ったときに名前表示する
            const extentSize = getSize(mapView.extent);
            const minLen = Math.min(extentSize[0], extentSize[1]);
            const extent = buffer(mapView.extent, -(minLen/5));
            return geometry.intersectsExtent(extent);
        });
    }, [namedEarth, mapView.extent, getMap]);

    const prevCurrentAreaNamedEarth = usePrevious(currentAreaNamedEarth);

    // 島名の付与された島に変更があった場合
    useEffect(() => {
        // オーバレイを配置する
        currentAreaNamedEarth.forEach(item => {
            const exist = prevCurrentAreaNamedEarth?.some(prev => prev.id === item.id);
            if (exist) return;

            // 追加
            const element = landNameRefMap[getMapKey(item.id)];
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
            const olFeature = getMap()?.getFeatureById(item.id);
            const geometry = olFeature?.getGeometry();
            if (!geometry) {
                return;
            }
            const coord = geometry.getExtent();
            overlay.setPosition([
                coord[0] + (coord[2] - coord[0]) / 2, 
                coord[1] + (coord[3] - coord[1]) / 2
            ]);
            getMap()?.addOverlay(overlay);            
            landNameOverlayMap[getMapKey(item.id)] = overlay;
        });

        prevCurrentAreaNamedEarth?.forEach(item => {
            const exist = currentAreaNamedEarth.some(cur => cur.id === item.id);
            if (exist) return;

            // 削除
            const overlay = landNameOverlayMap[getMapKey(item.id)];
            getMap()?.removeOverlay(overlay);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAreaNamedEarth, prevCurrentAreaNamedEarth]);

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
                            <div className={`${styles.LandnameOverlay} ${fadeClass}`} ref={ref => landNameRefMap[getMapKey(item.id)] = ref as HTMLDivElement}>
                                {item.name}
                            </div>
                        </div>
                    )
                })
            }
        </React.Fragment>
    );
}