import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import styles from './MapChart.module.scss';
import PopupContainer from "../popup/PopupContainer";
import DrawController from "../map/DrawController";
import { addListener, removeListener } from "../../util/Commander";
import LandNameOverlay from "../map/LandNameOverlay";
import { DataId, FeatureType } from "279map-common";
import { MapMode } from "../../types/types";
import Feature from "ol/Feature";
import ClusterMenuController from "../cluster-menu/ClusterMenuController";
import { OlMapType } from "./OlMapWrapper";
import { useWatch } from "../../util/useWatch";
import { Geometry } from "ol/geom";
import { sleep } from "../../util/CommonUtility";
import { useProcessMessage } from "../common/spinner/useProcessMessage";
import { mapModeAtom, mapViewAtom, selectedItemIdsAtom } from "../../store/operation";
import { currentMapKindAtom } from "../../store/session";
import { useAtom } from 'jotai';
import { useMap } from "../map/useMap";

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const [initialized, setInitialized] = useState(false);
    const mapRef = useRef<OlMapType>();
    const [mapMode] = useAtom(mapModeAtom);

    const [ mapKind ] = useAtom(currentMapKindAtom);
    
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    const [ selectedItemIds, setSelectedItemIds ] = useAtom(selectedItemIdsAtom);

    /**
     * 地図初期化
     */
    const [mapView, setMapView] = useAtom(mapViewAtom);
    const { createMapInstance, destroyMapInstance, loadCurrentAreaContents } = useMap();
    useEffect(() => {
        if (myRef.current === null) {
            return;
        }
        const map = createMapInstance(myRef.current);
        mapRef.current = map;

        setInitialized(true);

        return () => {
            map.dispose();
            destroyMapInstance();
        }
    }, [createMapInstance, destroyMapInstance]);

    /**
     * 地図パンニング等に伴うアイテムロード処理フック
     */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const loadLatestDataHandler = addListener('LoadLatestData', async() => {
            await loadCurrentAreaContents();
        });

        // 地図移動時にコンテンツロード
        const loadContentFunc = async() => {
            const h = showProcessMessage({
                overlay: false,
                spinner: true,
            });
            await loadCurrentAreaContents();
            const extent = map.getExtent();
            const zoom = map.getZoom();
            setMapView({extent, zoom});
            hideProcessMessage(h);
        };
        map.on('moveend', loadContentFunc);

        return () => {
            map.un('moveend', loadContentFunc);
            removeListener(loadLatestDataHandler);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadCurrentAreaContents]);


    const onSelectItem = useCallback((feature: DataId | undefined) => {
        if (!feature) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds([feature]);
        }

    }, [setSelectedItemIds]);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useWatch(() => {
        if (!mapKind || !mapRef.current) {
            return;
        }
        if (mapRef.current.getLayerLength() > 0) {
            // 起動時以外の地図切り替えはアニメーション
            setFlipping(true);
            setTimeout(() => {
                setFlipping(false);
            }, 1500);
        }

    }, [mapKind]);

    const optionClassName = useMemo(() => {
        if (flipping) {
            return styles.Flip;
        } else {
            return undefined;
        }
    }, [flipping]);

    return (
        <div className={styles.Container}>
            <div ref={myRef} className={`${styles.Chart} ${optionClassName}`} />
            {initialized &&
                (
                    <>
                        <PopupContainer />
                        <LandNameOverlay />
                        {mapMode === MapMode.Normal &&
                            <ClusterMenuController
                                targets={[FeatureType.STRUCTURE, FeatureType.AREA]}
                                onSelect={onSelectItem} />
                        }
                        <DrawController />
                    </>
                )
            }
        </div>
    )
}