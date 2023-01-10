import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map, MapBrowserEvent, View } from 'ol';
import * as olControl from 'ol/control';
import prefJson from './pref.json';
import GeoJSON from 'ol/format/GeoJSON';
import { Cluster, Vector as VectorSource } from "ol/source";
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import VectorLayer from "ol/layer/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import BaseLayer from "ol/layer/Base";
import styles from './MapChart.module.scss';
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import {buffer, Extent } from 'ol/extent';
import * as MapUtility from '../../util/MapUtility';
import PopupContainer from "../popup/PopupContainer";
import DrawController from "../map/DrawController";
import { addListener, removeListener } from "../../util/Commander";
import { defaults } from 'ol/interaction'
import { operationActions } from "../../store/operation/operationSlice";
import LandNameOverlay from "../map/LandNameOverlay";
import { useFilter } from "../../store/useFilter";
import { loadItems } from "../../store/data/dataThunk";
import { openItemContentsPopup } from "../popup/popupThunk";
import { FeatureType, GeoJsonPosition, MapKind } from "279map-common";
import { FeatureProperties } from "../../types/types";
import { useAPI } from "../../api/useAPI";
import useFilteredPointStyle from "../map/useFilteredPointStyle";
import useFilteredTopographyStyle from "../map/useFilteredTopographyStyle";
import useTrackStyle from "../map/useTrackStyle";
import { FeatureLike } from "ol/Feature";
import { Coordinate } from "ol/coordinate";
import ClusterMenu from "../cluster-menu/ClusterMenu";
import { usePrevious } from "../../util/usePrevious";

type ClusterMenuInfo = {
    position: Coordinate;
    itemIds: string[];
}
export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const mapRef = useRef(null as Map | null);
    const [clusterMenuInfo, setClusterMenuInfo] = useState<ClusterMenuInfo|null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);

    useEffect(() => {
        setClusterMenuInfo(null);
    }, [mapMode]);

    // コンテンツ（建物・ポイント）レイヤ
    const pointContentsSourceRef = useRef(new VectorSource());
    const pointClusterSourceRef = useRef(new Cluster({
        distance: 80,
        minDistance: 20,
        source: pointContentsSourceRef.current,
    }));
    const pointClusterLayerRef = useRef(new VectorLayer({
        source: pointClusterSourceRef.current,
        zIndex: 10,
        properties: {
            name: 'itemLayer',
        },
    }))
    useFilteredPointStyle({
        structureLayer: pointClusterLayerRef.current,
    });

    // コンテンツ（地形）レイヤ
    const topographyContentsSourceRef = useRef(new VectorSource());
    const topographyContentsLayerRef = useRef(new VectorLayer({
        source: topographyContentsSourceRef.current,
        zIndex: 2,
        properties: {
            name: 'topographyLayer',
        },
    }));
    useFilteredTopographyStyle({
        topographyLayer: topographyContentsLayerRef.current,
    });

    // 軌跡レイヤ
    const trackLayersRef = useRef<VectorLayer<VectorSource>[]>([]); // ズームレベルごとにレイヤ管理
    const isDrawing = useRef(false);    // 描画中かどうか

    const mapId = useSelector((state: RootState) => state.session.connectedMap?.mapId);
    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    const defaultExtent = useSelector((state: RootState) => state.data.extent);
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const itemMapRef = useRef(itemMap); // リアクティブに使用する必要のない箇所で使用する用途
    useEffect(() => {
        itemMapRef.current = itemMap;
    }, [itemMap]);

    const geoJsonItems = useMemo(() => {
        return Object.values(itemMap).filter(content => content.position.type === 'geoJson');
    }, [itemMap]);
    const trackItems = useMemo(() => {
        return Object.values(itemMap).filter(content => content.position.type === 'track');
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
        if (!filteredItemIdList || !mapRef.current || filteredItemIdList.length === 0) {
            return;
        }
        const source = new VectorSource();
        const map = mapRef.current;
        filteredItemIdList.forEach(itemId => {
            const feature = MapUtility.getFeatureByItemId(map, itemId);
            if (feature) {
                source.addFeature(feature);
            } else {
                console.warn('feature not found.', itemId);
            }
        });
        if (source.getFeatures().length === 0) {
            return;
        }
        const ext = source.getExtent();
        const currentZoom = map.getView().getZoom();
        map.getView().fit(ext, {
            padding: [10, 10, 10, 10],
            maxZoom: currentZoom,
        });
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
        if (!mapRef.current) {
            return;
        }
        const zoom = mapRef.current.getView().getZoom();
        if (zoom === undefined) {
            return;
        }
        loadingCurrentAreaContents.current = true;
        const ext = mapRef.current.getView().calculateExtent();
        const convertFunc = (pos: number): number => {
            if (pos > 180) {
                return -(360 - pos);
            } else if (pos < -180) {
                return 360 + pos;
            } else {
                return pos;
            }
        };
        ext[0] = convertFunc(ext[0]);
        ext[1] = convertFunc(ext[1]);
        ext[2] = convertFunc(ext[2]);
        ext[3] = convertFunc(ext[3]);
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

        mapRef.current = new Map({
            target: myRef.current,
            controls: olControl.defaults({attribution: true}),
            view: new View({
                projection: 'EPSG:4326',
                maxZoom: 20,
                // extent: prefSource.getExtent(),
            }),
            interactions: defaults({ doubleClickZoom: false }),
        });

        // TODO: 右クリック時
        // mapRef.current.getViewport().addEventListener('contextmenu', (evt) => {
        //     evt.preventDefault();
        //     state.popupPosition = undefined;
        //     state.lonlatPopupPosition = map.getEventCoordinate(evt);
        // });

        // ポップアップ表示対象のアイテムか
        const isTarget = (id: string): boolean => {
            const item = itemMapRef.current[id];
            const featureType = item?.geoProperties?.featureType;
            if (!featureType) {
                return false;
            }
            if (featureType === FeatureType.STRUCTURE || featureType === FeatureType.AREA) {
                return true;
            }
            // コンテンツを持つか
            if (item.contents) {
                return true;
            } else {
                return false;
            }
        }

        mapRef.current.on('click', (evt: MapBrowserEvent<any>) => {
            if (mapRef.current === null || isDrawing.current) {
                return;
            }
            setClusterMenuInfo(null);
            // クリック位置付近にあるアイテムIDを取得
            let points = [] as string[];
            mapRef.current.forEachFeatureAtPixel(evt.pixel, (f) => {
                const id = f.getId() as string | undefined;
                if (id !== undefined) {
                    points.push(id);
                    return;
                }
                const features = f.get('features');
                if (!features) {
                    return;
                }
                (features as FeatureLike[]).forEach(feature => {
                    const id = feature.getId() as string | undefined;
                    if (id !== undefined) {
                        points.push(id);
                    }
                });
            });
            // フィルタ時はフィルタ対象外のものに絞る
            if (filteredItemIdListRef.current) {
                points = points.filter(point => filteredItemIdListRef.current?.includes(point));
            }

            if (points.length === 0) {
                dispatch(operationActions.unselectItem());
                return;
            } else if (points.length === 1 && itemMapRef.current[points[0]]?.contents) {
                dispatch(operationActions.setSelectItem(points));
                return;
            }

            // show the cluseter menu when multiple items or the item has no contents
            // 対象が複数存在する場合またはコンテンツを持たないアイテムの場合は、重畳選択メニューを表示
            setClusterMenuInfo({
                position: evt.coordinate,
                itemIds: points,
            });
        });
        mapRef.current.on('loadend', () => {
            setMapLoaded(true);
            console.log('loadend');
        })

        // // クリック位置付近の以下条件に該当する全アイテムをポップアップ表示
        // // - 建物、地点、エリア
        // // - コンテンツまたは概要情報を持つ島、緑地、道
        // mapRef.current.on('click', (evt: MapBrowserEvent<any>) => {
        //     if (mapRef.current === null || isDrawing.current) {
        //         return;
        //     }
        //     // クリック位置付近にあるシンボルを取得
        //     const points = [] as string[];
        //     mapRef.current.forEachFeatureAtPixel(evt.pixel, (f) => {
        //         const id = f.getId() as string | undefined;
        //         if (id === undefined) {
        //             return;
        //         }
        //         if (isTarget(id)) {
        //             points.push(id);
        //         }
        //     });
        //     if (points.length === 0) {
        //         dispatch(operationActions.clearPopup());
        //         dispatch(operationActions.unselectItem());
        //     } else {
        //         // 一番手前のものを選択状態にしてポップアップ表示。ただし、シンボルに関しては重なっているものは全て選択状態とする。
        //         const targets = points.filter((point, index) => {
        //             if (index === 0) {
        //                 return true;
        //             }
        //             const item = itemMapRef.current[point];
        //             if (item?.geoProperties?.featureType === FeatureType.STRUCTURE) {
        //                 return true;
        //             }
        //             return false;
        //         })
        //         dispatch(openItemPopup({
        //             itemIds: targets,
        //             force: true
        //         }));
        //         dispatch(operationActions.setSelectItem(targets));
        //     }
        // });

        // クリック可能な地図上アイテムhover時にポインター表示
        mapRef.current.on('pointermove', (evt) => {
            if (mapRef.current === null || isDrawing.current) {
                return;
            }
            const hitIds = [] as string[];
            mapRef.current.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                const layerName = layer.getProperties()['name'];
                if (layerName === 'itemLayer') {
                    const features = feature.get('features') as FeatureLike[];
                    features.forEach(f => {
                        const id = f.getId() as string;
                        hitIds.push(id)
                    });
                } else if(layerName === 'topographyLayer') {
                    const id = feature.getId() as string;
                    hitIds.push(id)
                }
            });
            const isHover = hitIds.some(id => isTarget(id));
            if (isHover) {
                mapRef.current.getTargetElement().style.cursor = 'pointer';
            } else {
                mapRef.current.getTargetElement().style.cursor = '';
            }
        });

        const h = addListener('LoadLatestData', async() => {
            await loadCurrentAreaContents();
        });

        return () => {
            if (mapRef.current) {
                console.log('map dispose');
                mapRef.current.dispose();
            }
            removeListener(h);
        }
    }, [dispatch, loadCurrentAreaContents]);

    /**
     * 地図が切り替わったら、レイヤ再配置
     */
    useEffect(() => {
        if (!mapRef.current) {
            console.warn('mapRef nothing')
            return;
        }
        console.log('map create start');

        if (mapRef.current.getAllLayers().length > 0) {
            // 起動時以外の地図切り替えはアニメーション
            setFlipping(true);
            setTimeout(() => {
                setFlipping(false);
            }, 1500);
        }

        // 現在のレイヤ、データソースを削除
        mapRef.current.getAllLayers().forEach(layer => {
            mapRef.current?.removeLayer(layer);
        });
        pointContentsSourceRef.current.clear();
        topographyContentsSourceRef.current.clear();
        trackLayersRef.current.forEach(layer => {
            mapRef.current?.removeLayer(layer);
            layer.getSource()?.clear();
        });
        trackLayersRef.current = [];
        
        // 背景地図レイヤ生成
        let layers: BaseLayer[] = [];
        let extent: Extent | undefined = undefined;
        console.log('mapKind', mapKind);
        if (mapKind === MapKind.Real) {
            // 都道府県レイヤ
            const features = new GeoJSON().readFeatures(prefJson);
            const prefSource = new VectorSource({ features });
    
            layers = [
                new TileLayer({
                    source: new OSM(),
                    zIndex: 0,
                    minZoom: 10,
                }),
                // 都道府県レイヤ
                new VectorLayer({
                    source: prefSource,
                    maxZoom: 10,
                    zIndex: 1,
                    style: new Style({
                        fill: new Fill({
                            color: '#F5F2E9',
                        }),
                        stroke: new Stroke({
                            color: '#aaaaaa',
                            width: 1,
                        })
                    })
                }),
            ];

            extent = prefSource.getExtent();
        }
        // コンテンツ（地形orエリア）レイヤ追加
        layers.push(topographyContentsLayerRef.current);

        // コンテンツ（建物）レイヤ設定
        // mapStyleHook.setPointsLayer(pointContentsLayerRef.current);
        // layers.push(pointContentsLayerRef.current);
        // mapStyleHook.setPointsLayer(clusterLayerRef.current);
        layers.push(pointClusterLayerRef.current);

        mapRef.current.setLayers(layers);

        mapRef.current.getView().setMaxZoom(mapKind === MapKind.Virtual ? 10 : 18);
        if (extent) {
            mapRef.current.getView().fit(extent);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapId, mapKind]);

    // 地図ロード完了後にfitさせる
    useEffect(() => {
        if (!defaultExtent) {
            return;
        }
        // アイテム0件の時はフィットさせない
        if (defaultExtent.some(i => i !== 0)) {
            const extent = buffer(defaultExtent, 0.1);
            console.log('extent', defaultExtent);
            mapRef.current?.getView().fit(extent);
        }
        loadCurrentAreaContents()

        const updateStoreViewInfo = () => {
            const view = mapRef.current?.getView();
            if (!view) {
                return;
            }
            const extent = view.calculateExtent();
            const zoom = view.getZoom();
            dispatch(operationActions.updateMapView({extent, zoom}));
        }
    
        // 地図移動時にコンテンツロード
        mapRef.current?.on('moveend', async() => {
            await loadCurrentAreaContents();
            updateStoreViewInfo();
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultExtent]);

    const { getGeocoderFeature } = useAPI();
    /**
     * アイテムFeatureをSourceにロードする
     * @param source ロード先
     */
    const loadItemsToSource = useCallback(async() => {
        if (!pointContentsSourceRef.current) {
            return;
        }
        console.log('loadItemsToSource');
        // 追加、更新
        for (const def of geoJsonItems) {
            let featurething;
            if (def.geoProperties?.featureType === FeatureType.AREA && def.geoProperties.geocoderId) {
                // Geocoderの図形の場合は、Geocoder図形呼び出し
                const geoJson = await getGeocoderFeature(def.geoProperties.geocoderId);
                featurething = new GeoJSON().readFeatures(geoJson)[0];

            } else {
                featurething = MapUtility.createFeatureByGeoJson(def.position as GeoJsonPosition, def.geoProperties);
            }

            if (!featurething) {
                console.warn('contents could not be loaded.', def.id, JSON.stringify(def));
                return;
            }
            featurething.setId(def.id);
            const properties = Object.assign({}, def.geoProperties ? def.geoProperties : {}, {
                name: def.name,
                lastEditedTime: def.lastEditedTime,
            }) as FeatureProperties;
            featurething.setProperties(properties);
            
            let source;
            switch(def.geoProperties?.featureType as FeatureType) {
                case FeatureType.STRUCTURE:
                    source = pointContentsSourceRef.current;
                    break;
                case FeatureType.EARTH:
                case FeatureType.FOREST:
                case FeatureType.ROAD:
                case FeatureType.AREA:
                        source = topographyContentsSourceRef.current;
                    break;
                default:
                    source = pointContentsSourceRef.current;
            }
            if (source === null) {
                console.warn('想定外エラー');
                return;
            }
            const existFeature = source.getFeatureById(def.id);
            if (existFeature) {
                if (existFeature.getProperties()['lastEditedTime'] !== def.lastEditedTime) {
                    console.log('update feature');
                    existFeature.setGeometry(featurething.getGeometry());
                    existFeature.setProperties(featurething.getProperties());
                }
            } else {
                console.log('add feature');
                source.addFeature(featurething);
            }
        }
        // 削除
        const deleteFeatureFunc = (source: VectorSource) => {
            const deleteFeatures = source.getFeatures().filter(feature => {
                const id = feature.getId();
                const exist = geoJsonItems.some(content => content.id === id);
                return !exist;
            });
            deleteFeatures.forEach(feature => {
                console.log('removeFeature', feature.getId());
                source.removeFeature(feature);
            });
        };
        deleteFeatureFunc(pointContentsSourceRef.current);
        if (topographyContentsSourceRef.current) {
            deleteFeatureFunc(topographyContentsSourceRef.current);
        }

    }, [geoJsonItems, getGeocoderFeature]);

    const focusItemId = useSelector((state: RootState) => state.operation.focusItemId);
    const operationMapKind = useSelector((state: RootState) => state.operation.currentMapKind);
    // 初期FitさせるFeatureが指定されていて、そのFeatureが追加されたなら、Fit
    useEffect(() => {
        if (!focusItemId) return;
        console.log('focusItemId', focusItemId);
        if (operationMapKind && mapKind !== operationMapKind) {
            // 地図の切り替え完了していない場合
            return;
        }

        const getFeature = new Promise<FeatureLike>((resolve) => {
            const searchFeatureFromAllLayers = (id: string) => {
                const feature = pointContentsSourceRef.current.getFeatureById(id);
                if (feature) {
                    return feature;
                }
                const feature2 = topographyContentsSourceRef.current.getFeatureById(id);
                return feature2;
            };

            const feature = searchFeatureFromAllLayers(focusItemId);
    
            if (feature) {
                resolve(feature);
                return;
            }
            // featureが存在しないなら、追加されるまで待つ
            const eventSource = [] as VectorSource[];
            const eventFn = () => {
                const feature = searchFeatureFromAllLayers(focusItemId);
                if (!feature) return;

                eventSource.forEach(eSource => {
                    eSource.un('addfeature', eventFn);
                });
                resolve(feature);
            };
            mapRef.current?.getAllLayers().forEach((layer) => {
                const source = layer.getSource();
                if (!source) {
                    return;
                }
                if (!(source instanceof VectorSource)) {
                    return;
                }
                eventSource.push(source);
                source.on('addfeature', eventFn);
            });
        });

        getFeature
        .then((feature) => {
            // 特定のFeatureが指定されている場合は、そこにfitさせる
            const ext = feature.getGeometry()?.getExtent();
            if (!ext) return;

            mapRef.current?.getView().fit(ext, {
                duration: 1000,
                callback: () => {
                    // ポップアップ表示
                    dispatch(openItemContentsPopup([{
                        type: 'item',
                        itemId: focusItemId,
                    }]));
                }
            });

            // fitしおわったら除去
            dispatch(operationActions.setFocusItemId(null));

        })

    }, [dispatch, focusItemId, mapKind, operationMapKind]);

    useEffect(() => {
        // コンテンツを地図ソースに追加
        loadItemsToSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemMap]);

    const trackStyleHook = useTrackStyle();
    useEffect(() => {
        // 新たに追加された軌跡について描画する
        if (mapKind !== MapKind.Real) {
            return;
        }
        trackItems.forEach((contents) => {
            if (contents.position.type !== 'track') {
                return;
            }
            const track = contents.position;
            // 指定のズーム範囲のレイヤを取得する
            let targetLayer = trackLayersRef.current.find((layer): boolean => {
                return track.min_zoom === layer.getMinZoom() && track.max_zoom === layer.getMaxZoom();
            });
            // 存在しない場合は、新規レイヤ作成
            if (targetLayer === undefined) {
                targetLayer = new VectorLayer({
                    source: new VectorSource(),
                    minZoom: track.min_zoom,
                    maxZoom: track.max_zoom,
                    zIndex: 1,
                });
                trackStyleHook.addLayer(targetLayer);
                trackLayersRef.current.push(targetLayer);
                mapRef.current?.addLayer(targetLayer);
            }

            // 既に描画済みの場合は何もしない
            const hit = targetLayer.getSource()?.getFeatureById(contents.id);
            if (hit) {
                return;
            }

            // geojsonを追加
            const feature = new GeoJSON().readFeatures(track.geojson)[0];
            feature.setId(contents.id);
            targetLayer.getSource()?.addFeature(feature);
        });
        // 削除
        trackLayersRef.current.forEach((layer) => {
            const source = layer.getSource();
            if (!source) {
                return;
            }
            const deleteFeatures = source.getFeatures().filter(feature => {
                const id = feature.getId();
                const exist = trackItems.some(content => content.id === id);
                return !exist;
            });
            deleteFeatures.forEach(feature => {
                source.removeFeature(feature);
            });
        });


        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackItems]);

    const optionClassName = useMemo(() => {
        if (flipping) {
            return styles.Flip;
        } else {
            return undefined;
        }
    }, [flipping]);

    // close cluster menu when zoom level is changed
    const mapView = useSelector((state: RootState) => state.operation.mapView);
    const prevMapView = usePrevious(mapView);
    useEffect(() => {
        if (mapView.zoom === prevMapView?.zoom) {
            return;
        }
        setClusterMenuInfo(null);
    }, [mapView, prevMapView]);

    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);
    useEffect(() => {
        if (selectedItemIds.length > 0) {
            setClusterMenuInfo(null);
        }
    }, [selectedItemIds]);

   const onClusterMenuSelected = useCallback((id: string) => {
        setClusterMenuInfo(null);
        dispatch(operationActions.setSelectItem([id]));
    }, [dispatch]);

    // set the cluster distance by zoomLv.
    useEffect(() => {
        if (mapView.zoom === prevMapView?.zoom) {
            return;
        }
        const resolution = mapRef.current?.getView().getResolution();
        if (!resolution) return;
        const structureScale = MapUtility.getStructureScale(resolution);
        pointClusterSourceRef.current.setDistance(80 * structureScale);
        pointClusterSourceRef.current.setMinDistance(20 * structureScale);
    }, [mapView, prevMapView]);

    return (
        <div className={styles.Container}>
            <div ref={myRef} className={`${styles.Chart} ${optionClassName}`} />
            {mapRef.current !== null &&
                (
                    <>
                        {clusterMenuInfo &&
                            <ClusterMenu map={mapRef.current} showAddContentMenu={true}
                                {...clusterMenuInfo} onSelect={onClusterMenuSelected} />
                        }
                        {mapLoaded &&
                            <PopupContainer map={mapRef.current} />
                        }
                        <LandNameOverlay map={mapRef.current} />
                        <DrawController map={mapRef.current} onStart={()=>{isDrawing.current=true}} onEnd={()=>{isDrawing.current=false}} />
                    </>
                )
            }
        </div>
    )
}