import React, { useCallback, useMemo, useRef, useState, useContext, useEffect } from "react";
import { Vector as VectorSource } from "ol/source";
import styles from './MapChart.module.scss';
import PopupContainer from "../popup/PopupContainer";
import DrawController from "../map/DrawController";
import { addListener, removeListener } from "../../util/Commander";
import LandNameOverlay from "../map/LandNameOverlay";
import { DataId, FeatureType } from "279map-common";
import { MapMode } from "../../types/types";
import Feature from "ol/Feature";
import { usePrevious } from "../../util/usePrevious";
import ClusterMenuController from "../cluster-menu/ClusterMenuController";
import { OwnerContext } from "./TsunaguMap";
import { OlMapType } from "./OlMapWrapper";
import { useWatch } from "../../util/useWatch";
import { Geometry } from "ol/geom";
import { sleep } from "../../util/CommonUtility";
import useMyMedia from "../../util/useMyMedia";
import { useProcessMessage } from "../common/spinner/useProcessMessage";
import { useLoadItem } from "../../store/item/useItem";
import { mapModeAtom, mapViewAtom, selectedItemIdsAtom } from "../../store/operation";
import { currentMapKindAtom, defaultExtentAtom } from "../../store/session";
import { filteredItemIdListAtom } from "../../store/filter";
import { useAtom } from 'jotai';
import { itemDataSourcesAtom } from "../../store/datasource";
import { useAtomCallback } from 'jotai/utils';
import { useMap } from "../map/useMap";

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const [initialized, setInitialized] = useState(false);
    const mapRef = useRef<OlMapType>();
    const [mapMode] = useAtom(mapModeAtom);

    const [ mapKind ] = useAtom(currentMapKindAtom);
    const [ itemDataSources ] = useAtom(itemDataSourcesAtom);
    
    const loadingCurrentAreaContents = useRef(false);
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    /**
     * 全アイテムが含まれる領域でフィットさせる
     */
    const fitToDefaultExtent = useAtomCallback(
        useCallback((get, set, animation: boolean) => {
            const defaultExtent = get(defaultExtentAtom); 
            if (!defaultExtent || !mapRef.current) {
                return;
            }
            // アイテム0件の時はフィットさせない
            if (defaultExtent.some(i => i !== 0)) {
                mapRef.current.fit(defaultExtent, {
                    animation,
                });
            }

        }, [])
    );

    /**
     * フィルタ時にフィルタ対象がExtentに入るようにする
     */
    const [filteredItemIdList] = useAtom(filteredItemIdListAtom);
    const prevFilteredItemIdList = usePrevious(filteredItemIdList);
    useWatch(() => {
        if (!mapRef.current) return;
        if (!filteredItemIdList || filteredItemIdList.length === 0) {
            if (prevFilteredItemIdList && prevFilteredItemIdList.length > 0) {
                // フィルタ解除された場合、全体fit
                fitToDefaultExtent(true);
            }
            return;
        }
        const source = new VectorSource();
        filteredItemIdList.forEach(itemId => {
            const feature = mapRef.current?.getFeatureById(itemId);
            if (feature) {
                // Cluster化している場合は、既にsourceに追加されている可能性があるので、
                // 追加済みでない場合のみ追加
                if (!source.hasFeature(feature)) {
                    source.addFeature(feature);
                }
            } else {
                console.warn('feature not found.', itemId);
            }
        });
        if (source.getFeatures().length === 0) {
            return;
        }
        const ext = source.getExtent();
        mapRef.current.fit(ext, {
            animation: true,
        });
        source.dispose();

    }, [filteredItemIdList]);

    const { loadItems } = useLoadItem();

    /**
     * 現在の地図表示範囲内に存在するコンテンツをロードする
     */
     const loadCurrentAreaContents = useCallback(async() => {
        console.log('loadCurrentAreaContents', mapRef.current);
        if (!mapRef.current) return;
        if (loadingCurrentAreaContents.current) {
            // 二重起動禁止
            console.log('二重起動禁止');
            return;
        }
        const zoom = mapRef.current.getZoom();
        if (!zoom) {
            return;
        }
        loadingCurrentAreaContents.current = true;
        const ext = mapRef.current.getExtent();
        await loadItems({zoom, extent: ext});
        loadingCurrentAreaContents.current = false;

    }, [loadItems]);

    /**
     * 指定のitemにfitさせる
     */
    const focusItem = useCallback(async(itemId: DataId, zoom?: boolean) => {
        if (!mapRef.current) {
            return;
        }

        const map = mapRef.current;
        const getFeatureFunc = async() => {
            let itemFeature: undefined | Feature<Geometry>;
            let retryCnt = 0;
            do {
                itemFeature = map.getFeatureById(itemId);
                if (!itemFeature) {
                    // アイテムが存在しない場合は、データロード中の可能性があるので、しばらく待ってからリトライ
                    retryCnt++;
                    await sleep(0.5);
                } else {
                    return itemFeature;
                }
            } while(itemFeature === undefined && retryCnt < 5);
            return itemFeature;
        };
        const itemFeature = await getFeatureFunc();
        if (!itemFeature) {
            console.warn('focusItem target not found', itemId);
            return;
        }

        const ext = itemFeature.getGeometry()?.getExtent();
        if (!ext) return;
        mapRef.current.fit(ext, {
            animation: true,
            zoom,
        });

    }, []);

    const { isPC } = useMyMedia();
    const { mapInstanceId } = useContext(OwnerContext);
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();
    const [ selectedItemIds, setSelectedItemIds ] = useAtom(selectedItemIdsAtom);

    /**
     * 地図初期化
     */
    const [mapView, setMapView] = useAtom(mapViewAtom);
    const { createMapInstance, destroyMapInstance } = useMap();
    useEffect(() => {
        if (myRef.current === null) {
            return;
        }
        const map = createMapInstance(myRef.current, isPC ? 'pc' : 'sp');
        mapRef.current = map;

        // アイテムフォーカスイベントの登録
        const focusItemHandler = addListener('FocusItem', async(param: {itemId: DataId; zoom?: boolean}) => {
            focusItem(param.itemId, param.zoom);
            setSelectedItemIds([param.itemId]);
        });

        setInitialized(true);

        return () => {
            map.dispose();
            destroyMapInstance();
            removeListener(focusItemHandler);
        }
    }, []);

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

    useWatch(() => {
        mapRef.current?.changeDevice(isPC ? 'pc' : 'sp');
    }, [isPC]);

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

        // 現在のレイヤ、データソースを削除
        mapRef.current.clearAllLayers();
        
        // 初期レイヤ生成
        mapRef.current.initialize(mapKind, itemDataSources);

        fitToDefaultExtent(false);
        loadCurrentAreaContents()

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