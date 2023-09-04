import React, { useMemo, useRef, useState, useEffect } from "react";
import styles from './MapChart.module.scss';
import { mapViewAtom } from "../../store/operation";
import { currentMapKindAtom } from "../../store/session";
import { useAtom } from 'jotai';
import { useMap } from "../map/useMap";
import { usePrevious } from "../../util/usePrevious";

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const [ mapKind ] = useAtom(currentMapKindAtom);
    
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    /**
     * 地図初期化
     */
    const [, setMapView] = useAtom(mapViewAtom);
    const { createMapInstance, destroyMapInstance, map, loadCurrentAreaContents } = useMap();
    useEffect(() => {
        if (myRef.current === null) {
            return;
        }
        createMapInstance(myRef.current);

        return () => {
            destroyMapInstance();
        }
    }, [createMapInstance, destroyMapInstance]);

    /**
     * 地図パンニング等に伴うアイテムロード処理フック
     */
    useEffect(() => {
        if (!map) {
            return;
        }

        // 地図移動時にコンテンツロード
        const loadContentFunc = async() => {
            await loadCurrentAreaContents();
            const extent = map.getExtent();
            const zoom = map.getZoom();
            setMapView({extent, zoom});
        };
        map.on('moveend', loadContentFunc);

        return () => {
            map.un('moveend', loadContentFunc);
        }
    }, [map, loadCurrentAreaContents, setMapView]);

    const prevMapKind = usePrevious(mapKind);
    /**
     * 地図が切り替わったら、アニメーション
     */
    useEffect(() => {
        if (!mapKind || !prevMapKind) {
            // 起動時はアニメーションしない
            return;
        }
        if (prevMapKind === mapKind) {
            return;
        }
        // 起動時以外の地図切り替えはアニメーション
        setFlipping(true);
        setTimeout(() => {
            setFlipping(false);
        }, 1500);

    }, [mapKind, prevMapKind]);

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
        </div>
    )
}