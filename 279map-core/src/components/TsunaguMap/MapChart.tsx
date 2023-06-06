import React, { useCallback, useMemo, useRef, useState, useContext } from "react";
import { Vector as VectorSource } from "ol/source";
import styles from './MapChart.module.scss';
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import PopupContainer from "../popup/PopupContainer";
import DrawController from "../map/DrawController";
import { addListener, doCommand, removeListener } from "../../util/Commander";
import { operationActions } from "../../store/operation/operationSlice";
import LandNameOverlay from "../map/LandNameOverlay";
import { useFilter } from "../../store/useFilter";
import { loadItems } from "../../store/data/dataThunk";
import { DataId, FeatureType } from "279map-common";
import { MapMode } from "../../types/types";
import useFilteredTopographyStyle from "../map/useFilteredTopographyStyle";
import useTrackStyle from "../map/useTrackStyle";
import Feature from "ol/Feature";
import { usePrevious } from "../../util/usePrevious";
import usePointStyle from "../map/usePointStyle";
import ClusterMenuController from "../cluster-menu/ClusterMenuController";
import { OwnerContext } from "./TsunaguMap";
import { OlMapType, createMapInstance } from "./OlMapWrapper";
import { useMounted } from "../../util/useMounted";
import { useWatch } from "../../util/useWatch";
import { Geometry } from "ol/geom";
import { sleep } from "../../util/CommonUtility";
import useMyMedia from "../../util/useMyMedia";
import { useOverlay } from "../common/spinner/useOverlay";

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const [initialized, setInitialized] = useState(false);
    const mapRef = useRef<OlMapType>();
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);
    const { showSpinner, hideSpinner } = useOverlay();

    // スタイル設定
    // -- コンテンツ（建物・ポイント）レイヤ
    const { pointStyleFunction } = usePointStyle();
    // -- コンテンツ（地形）レイヤ
    const { topographyStyleFunction } = useFilteredTopographyStyle();
    // -- 軌跡レイヤ
    const { trackStyleFunction } = useTrackStyle();
    /**
     * スタイル定義が変化したら、地図スタイル設定
     */
    useWatch(() => {
        mapRef.current?.setPointLayerStyle(pointStyleFunction);
        mapRef.current?.setTopographyLayerStyle(topographyStyleFunction);
        mapRef.current?.setTrackLayerStyle(trackStyleFunction);
        
    }, [pointStyleFunction, topographyStyleFunction, trackStyleFunction])

    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);
    const dataSources = useSelector((state: RootState) => state.data.dataSourceGroups);

    const defaultExtent = useSelector((state: RootState) => state.data.extent);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const dispatch = useAppDispatch();

    const loadingCurrentAreaContents = useRef(false);
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    /**
     * 全アイテムが含まれる領域でフィットさせる
     */
    const fitToDefaultExtent = useCallback((animation: boolean) => {
        if (!defaultExtent || !mapRef.current) {
            return;
        }
        // アイテム0件の時はフィットさせない
        if (defaultExtent.some(i => i !== 0)) {
            mapRef.current.fit(defaultExtent, {
                animation,
            });
        }
    }, [defaultExtent]);

    /**
     * フィルタ時にフィルタ対象がExtentに入るようにする
     */
    const { filteredItemIdList } = useFilter();
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
        await dispatch(loadItems({zoom, extent: ext}));
        loadingCurrentAreaContents.current = false;

        // 初回起動時はスピナー表示しているので（MapWrapper内でshowSpinner）、ここでhideSpinnerしている
        hideSpinner();
    }, [dispatch, hideSpinner]);

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
    /**
     * 地図初期化
     */
    useMounted(() => {
        if (myRef.current === null) {
            return;
        }
        const map = createMapInstance(mapInstanceId, myRef.current, isPC ? 'pc' : 'sp');
        mapRef.current = map;

        const loadLatestDataHandler = addListener('LoadLatestData', async() => {
            await loadCurrentAreaContents();
        });
    
        // 地図移動時にコンテンツロード
        const loadContentFunc = async() => {
            await loadCurrentAreaContents();
            const extent = map.getExtent();
            const zoom = map.getZoom();
            dispatch(operationActions.updateMapView({extent, zoom}));
        };
        map.on('moveend', loadContentFunc);

        // アイテムフォーカスイベントの登録
        const focusItemHandler = addListener('FocusItem', async(param: {itemId: DataId; zoom?: boolean}) => {
            focusItem(param.itemId, param.zoom);
            dispatch(operationActions.setSelectItem([param.itemId]));
        });

        setInitialized(true);

        return () => {
            map.un('moveend', loadContentFunc);
            map.dispose();
            removeListener(loadLatestDataHandler);
            removeListener(focusItemHandler);
        }
    });
    useWatch(() => {
        mapRef.current?.changeDevice(isPC ? 'pc' : 'sp');
    }, [isPC]);

    const { disabledContentDialog } = useContext(OwnerContext);
    const onSelectItem = useCallback((feature: DataId | undefined) => {
        if (!feature) {
            dispatch(operationActions.unselectItem());
        } else {
            dispatch(operationActions.setSelectItem([feature]));
            // 詳細ダイアログ表示
            if (disabledContentDialog) return;
            doCommand({
                command: 'ShowItemInfo',
                param: feature,
            });
        }

    }, [dispatch, disabledContentDialog]);

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
        mapRef.current.initialize(mapKind, dataSources);

        fitToDefaultExtent(false);
        loadCurrentAreaContents()

    }, [mapKind]);

    /**
     * アイテムFeatureを地図に反映する
     */
    const geoJsonItems = useMemo(() => {
        return Object.values(itemMap);
    }, [itemMap]);
    const prevGeoJsonItems = usePrevious(geoJsonItems);
    useWatch(() => {
        if (!mapRef.current) return;
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
            mapRef.current?.removeFeature(item);
        });

    }, [geoJsonItems]);

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