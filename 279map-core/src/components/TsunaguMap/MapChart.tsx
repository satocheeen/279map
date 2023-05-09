import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import styles from './MapChart.module.scss';
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import { buffer } from 'ol/extent';
import * as MapUtility from '../../util/MapUtility';
import PopupContainer from "../popup/PopupContainer";
import DrawController from "../map/DrawController";
import { addListener, removeListener } from "../../util/Commander";
import { operationActions } from "../../store/operation/operationSlice";
import LandNameOverlay from "../map/LandNameOverlay";
import { useFilter } from "../../store/useFilter";
import { loadItems } from "../../store/data/dataThunk";
import { openItemContentsPopup } from "../popup/popupThunk";
import { DataId, FeatureType, MapKind } from "../../279map-common";
import { MapMode } from "../../types/types";
import useFilteredTopographyStyle from "../map/useFilteredTopographyStyle";
import useTrackStyle from "../map/useTrackStyle";
import Feature, { FeatureLike } from "ol/Feature";
import { usePrevious } from "../../util/usePrevious";
import usePointStyle from "../map/usePointStyle";
import ClusterMenuController from "../cluster-menu/ClusterMenuController";
import { createMapInstance, OlMapWrapper } from "./OlMapWrapper";

let instanceCnt = 0;

type MapChartContextType = {
    instanceId: string;
    map: OlMapWrapper;
}
const defaultDummyMapId = 'dummy';
const defaultDummyMap = new OlMapWrapper({
    id: defaultDummyMapId
});
export const MapChartContext = React.createContext<MapChartContextType>({
    instanceId: 'dummy',
    map: defaultDummyMap,
});

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const instanceIdRef = useRef('map-' + (++instanceCnt));
    const mapRef = useRef<OlMapWrapper>(defaultDummyMap);
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);

    const mapChartContextValue = {
        instanceId: instanceIdRef.current,
        map: mapRef.current,
    } as MapChartContextType;

    // スタイル設定
    // -- コンテンツ（建物・ポイント）レイヤ
    usePointStyle({
        map: mapRef.current
    });
    // -- コンテンツ（地形）レイヤ
    useFilteredTopographyStyle({
        map: mapRef.current,
    });
    // -- 軌跡レイヤ
    useTrackStyle({
        map: mapRef.current,
    });

    const isDrawing = useRef(false);    // 描画中かどうか

    const mapId = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return undefined;
        }
        return state.session.connectStatus.connectedMap.mapId;
    });
    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);
    const dataSources = useSelector((state: RootState) => state.session.currentMapKindInfo?.dataSources ?? []);

    const defaultExtent = useSelector((state: RootState) => state.data.extent);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const itemMapRef = useRef(itemMap); // リアクティブに使用する必要のない箇所で使用する用途
    useEffect(() => {
        itemMapRef.current = itemMap;
    }, [itemMap]);

    const geoJsonItems = useMemo(() => {
        return Object.values(itemMap);
        // return Object.values(itemMap).filter(content => content.geoProperties.featureType !== FeatureType.TRACK);
    }, [itemMap]);
    const prevGeoJsonItems = usePrevious(geoJsonItems);
    const trackItems = useMemo(() => {
        return [];
        // return Object.values(itemMap).filter(content => content.geoProperties.featureType === FeatureType.TRACK);
    }, [itemMap]);

    const dispatch = useAppDispatch();

    const loadingCurrentAreaContents = useRef(false);
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    /**
     * フィルタ時にフィルタ対象がExtentに入るようにする
     */
    const { filteredItemIdList } = useFilter();
    const filteredItemIdListRef = useRef(filteredItemIdList);   // for using in map event funtion
    useEffect(() => {
        filteredItemIdListRef.current = filteredItemIdList;
        if (!filteredItemIdList || filteredItemIdList.length === 0) {
            return;
        }
        const source = new VectorSource();
        filteredItemIdList.forEach(itemId => {
            const feature = mapRef.current.getFeatureById(itemId);
            // const feature = MapUtility.getFeatureByItemId(map, itemId.id);
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
        mapRef.current.fit(ext);
        source.dispose();

    }, [filteredItemIdList]);

    /**
     * 現在の地図表示範囲内に存在するコンテンツをロードする
     */
     const loadCurrentAreaContents = useCallback(async() => {
        if (loadingCurrentAreaContents.current) {
            // 二重起動禁止
            return;
        }
        const zoom = mapRef.current.getZoom();
        if (!zoom) {
            return;
        }
        loadingCurrentAreaContents.current = true;
        const ext = mapRef.current.getExtent();
        await dispatch(loadItems({zoom, extent: ext}));
        loadingCurrentAreaContents.current = false;
    }, [dispatch]);

    /**
     * 地図初期化
     */
    useEffect(() => {
        if (myRef.current === null) {
            return;
        }
        console.log('map initialized.');
        mapRef.current.dispose();
        mapRef.current = createMapInstance({
            id: instanceIdRef.current,
            target: myRef.current,
        });

        const h = addListener('LoadLatestData', async() => {
            await loadCurrentAreaContents();
        });

        return () => {
            console.log('map dispose');
            mapRef.current.dispose();
            removeListener(h);
        }
    }, [dispatch, loadCurrentAreaContents]);

    const onSelectItem = useCallback((feature: DataId | undefined) => {
        if (!feature) {
            dispatch(operationActions.unselectItem());
        } else {
            dispatch(operationActions.setSelectItem([feature]));
        }

    }, [dispatch]);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useEffect(() => {
        if (!mapKind) {
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
        console.log('mapKind', mapKind);
        mapRef.current.initialize(mapKind, dataSources);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapId, mapKind, dataSources]);

    // 地図ロード完了後にfitさせる
    useEffect(() => {
        if (!defaultExtent) {
            return;
        }
        // アイテム0件の時はフィットさせない
        if (defaultExtent.some(i => i !== 0)) {
            const extent = buffer(defaultExtent, 0.1);
            console.log('extent', defaultExtent);
            mapRef.current.fit(extent);
        }
        loadCurrentAreaContents()

        const updateStoreViewInfo = () => {
            const extent = mapRef.current.getExtent();
            const zoom = mapRef.current.getZoom();
            dispatch(operationActions.updateMapView({extent, zoom}));
        }
    
        // 地図移動時にコンテンツロード
        mapRef.current.on('moveend', async() => {
            await loadCurrentAreaContents();
            updateStoreViewInfo();
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultExtent]);

    /**
     * アイテムFeatureをSourceにロードする
     * @param source ロード先
     */
    const loadItemsToSource = useCallback(async() => {
        console.log('loadItemsToSource');
        // 追加、更新
        for (const def of geoJsonItems) {
            mapRef.current.addFeature(def);
        }
        // 削除
        // 削除アイテム＝prevGeoJsonItemに存在して、geoJsonItemsに存在しないもの
        const currentIds = geoJsonItems.map(item => item.id);
        const deleteItems = prevGeoJsonItems?.filter(pre => {
            return !currentIds.includes(pre.id);
        });
        deleteItems?.forEach(item => {
            mapRef.current.removeFeature(item);
        });

    }, [geoJsonItems, prevGeoJsonItems]);

    const focusItemId = useSelector((state: RootState) => state.operation.focusItemId);
    const operationMapKind = useSelector((state: RootState) => state.operation.currentMapKind);

    // TODO:
    // // 初期FitさせるFeatureが指定されていて、そのFeatureが追加されたなら、Fit
    // useEffect(() => {
    //     if (!focusItemId) return;
    //     console.log('focusItemId', focusItemId);
    //     if (operationMapKind && mapKind !== operationMapKind) {
    //         // 地図の切り替え完了していない場合
    //         return;
    //     }

    //     const getFeature = new Promise<FeatureLike>((resolve) => {
    //         const searchFeatureFromAllLayers = (id: string) => {
    //             const feature = mapRef.current.getFeatureById(id);
    //             if (feature) {
    //                 return feature;
    //             }
    //             const feature2 = VectorLayerMap.getSource('topography')?.getFeatureById(id);
    //             return feature2;
    //         };

    //         const feature = searchFeatureFromAllLayers(focusItemId);
    
    //         if (feature) {
    //             resolve(feature);
    //             return;
    //         }
    //         // featureが存在しないなら、追加されるまで待つ
    //         const eventSource = [] as VectorSource[];
    //         const eventFn = () => {
    //             const feature = searchFeatureFromAllLayers(focusItemId);
    //             if (!feature) return;

    //             eventSource.forEach(eSource => {
    //                 eSource.un('addfeature', eventFn);
    //             });
    //             resolve(feature);
    //         };
    //         mapRef.current?.getAllLayers().forEach((layer) => {
    //             const source = layer.getSource();
    //             if (!source) {
    //                 return;
    //             }
    //             if (!(source instanceof VectorSource)) {
    //                 return;
    //             }
    //             eventSource.push(source);
    //             source.on('addfeature', eventFn);
    //         });
    //     });

    //     getFeature
    //     .then((feature) => {
    //         // 特定のFeatureが指定されている場合は、そこにfitさせる
    //         const ext = feature.getGeometry()?.getExtent();
    //         if (!ext) return;

    //         mapRef.current?.getView().fit(ext, {
    //             duration: 1000,
    //             callback: () => {
    //                 // ポップアップ表示
    //                 dispatch(openItemContentsPopup([{
    //                     type: 'item',
    //                     itemId: focusItemId,
    //                 }]));
    //             }
    //         });

    //         // fitしおわったら除去
    //         dispatch(operationActions.setFocusItemId(null));

    //     })

    // }, [dispatch, focusItemId, mapKind, operationMapKind]);

    useEffect(() => {
        // コンテンツを地図ソースに追加
        loadItemsToSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemMap]);

    useEffect(() => {
        // 新たに追加された軌跡について描画する
        if (mapKind !== MapKind.Real) {
            return;
        }
        trackItems.forEach((item) => {
            // if (item.geoProperties.featureType !== FeatureType.TRACK) {
            //     return;
            // }
            mapRef.current.addFeature(item);
        });
        // // 削除
        // trackLayersRef.current.forEach((layer) => {
        //     const source = layer.getSource();
        //     if (!source) {
        //         return;
        //     }
        //     const deleteFeatures = source.getFeatures().filter(feature => {
        //         const id = feature.getId();
        //         const exist = trackItems.some(content => content.id === id);
        //         return !exist;
        //     });
        //     deleteFeatures.forEach(feature => {
        //         source.removeFeature(feature);
        //     });
        // });


        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackItems]);

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
            {mapRef.current !== null &&
                (
                    <MapChartContext.Provider value={mapChartContextValue}>
                        <PopupContainer />
                        <LandNameOverlay />
                        {mapMode === MapMode.Normal &&
                            <ClusterMenuController
                                targets={[FeatureType.STRUCTURE, FeatureType.AREA]}
                                onSelect={onSelectItem} />
                        }
                        <DrawController onStart={()=>{isDrawing.current=true}} onEnd={()=>{isDrawing.current=false}} />
                    </MapChartContext.Provider>
                )
            }
        </div>
    )
}