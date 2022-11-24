import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";
import 'ol/ol.css';
import { Map, MapBrowserEvent, View } from 'ol';
import * as olControl from 'ol/control';
import prefJson from './pref.json';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from "ol/source/Vector";
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
import useMapStyle from "../map/useMapStyle";
import DrawController from "../map/DrawController";
import { addListener, removeListener } from "../../util/Commander";
import { defaults } from 'ol/interaction'
import { operationActions } from "../../store/operation/operationSlice";
import LandNameOverlay from "../map/LandNameOverlay";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { useFilter } from "../../store/useFilter";
import { loadItems } from "../../store/data/dataThunk";
import { openItemContentsPopup, openItemPopup } from "../popup/popupThunk";
import { FeatureType, GeoJsonPosition, MapKind } from "279map-common";
import { FeatureProperties } from "../../types/types";
import { OwnerContext } from "./TsunaguMap";
import { useAPI } from "../../api/useAPI";

export default function MapChart() {
    const myRef = useRef(null as HTMLDivElement | null);
    const mapRef = useRef(null as Map | null);
    const ownerContext =  useContext(OwnerContext);

    // コンテンツ（建物・ポイント）レイヤ
    const pointContentsSourceRef = useRef(null as VectorSource | null);
    const pointContentsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

    // コンテンツ（地形）レイヤ
    const topographyContentsSourceRef = useRef(null as VectorSource | null);
    const topographyContentsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

    // 軌跡レイヤ
    const trackLayersRef = useRef<VectorLayer<VectorSource>[]>([]); // ズームレベルごとにレイヤ管理
    const isDrawing = useRef(false);    // 描画中かどうか

    const mapId = useSelector((state: RootState) => state.session.connectedMap?.mapId);
    const mapKind = useMemo(() => ownerContext.mapKind, [ownerContext.mapKind]);

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

    const mapStyleHook = useMapStyle();
    const dispatch = useAppDispatch();

    const loadingCurrentAreaContents = useRef(false);
    // trueにすると回転アニメーション発生
    const [flipping, setFlipping] = useState(false);

    /**
     * フィルタ時にフィルタ対象がExtentに入るようにする
     */
    const { filteredItemIdList } = useFilter();
    useEffect(() => {
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
            if (item.contentId) {
                return true;
            } else {
                return false;
            }
        }

        // クリック位置付近の以下条件に該当する全アイテムをポップアップ表示
        // - 建物、地点、エリア
        // - コンテンツまたは概要情報を持つ島、緑地、道
        mapRef.current.on('click', (evt: MapBrowserEvent<any>) => {
            if (mapRef.current === null || isDrawing.current) {
                return;
            }
            // クリック位置付近にあるシンボルを取得
            const points = [] as string[];
            mapRef.current.forEachFeatureAtPixel(evt.pixel, (f) => {
                const id = f.getId() as string | undefined;
                if (id === undefined) {
                    return;
                }
                if (isTarget(id)) {
                    points.push(id);
                }
            });
            if (points.length === 0) {
                dispatch(operationActions.clearPopup());
                dispatch(operationActions.unselectItem());
            } else {
                // 一番手前のものを選択状態にしてポップアップ表示。ただし、シンボルに関しては重なっているものは全て選択状態とする。
                const targets = points.filter((point, index) => {
                    if (index === 0) {
                        return true;
                    }
                    const item = itemMapRef.current[point];
                    if (item?.geoProperties?.featureType === FeatureType.STRUCTURE) {
                        return true;
                    }
                    return false;
                })
                dispatch(openItemPopup({
                    itemIds: targets,
                    force: true
                }));
                dispatch(operationActions.setSelectItem(targets));
            }
        });

        // クリック可能な地図上アイテムhover時にポインター表示
        mapRef.current.on('pointermove', (evt) => {
            if (mapRef.current === null || isDrawing.current) {
                return;
            }
            const hitIds = [] as string[];
            mapRef.current.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                const layerName = layer.getProperties()['name'];
                if (layerName === 'itemLayer' || layerName === 'topographyLayer') {
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

        const h = addListener('LoadLatestData', () => {
            loadCurrentAreaContents();
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
        pointContentsSourceRef.current?.clear();
        pointContentsSourceRef.current = null;
        topographyContentsSourceRef.current?.clear();
        topographyContentsSourceRef.current = null;
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
        // コンテンツ（地形orエリア）レイヤ生成
        topographyContentsSourceRef.current = new VectorSource();
        topographyContentsLayerRef.current = new VectorLayer({
            source: topographyContentsSourceRef.current,
            zIndex: 2,
            properties: {
                name: 'topographyLayer',
            },
        });
        mapStyleHook.setTopographyLayer(topographyContentsLayerRef.current);

        layers.push(topographyContentsLayerRef.current);

        // コンテンツ（建物）レイヤ生成
        pointContentsSourceRef.current = new VectorSource();
        pointContentsLayerRef.current = new VectorLayer({
            source: pointContentsSourceRef.current,
            zIndex: 10,
            properties: {
                name: 'itemLayer',
            },
        });
        mapStyleHook.setPointsLayer(pointContentsLayerRef.current);
        layers.push(pointContentsLayerRef.current);

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
                source.removeFeature(feature);
            });
        };
        deleteFeatureFunc(pointContentsSourceRef.current);
        if (topographyContentsSourceRef.current) {
            deleteFeatureFunc(topographyContentsSourceRef.current);
        }

        // TODO: 
        // 初期FitさせるFeatureが指定されていて、そのFeatureが追加されたなら、Fit
        // const featureId = searchParams.get('feature');
        // if (featureId) {
        //     let feature = null as Feature<Geometry> | null;
        //     mapRef.current?.getAllLayers().some((layer) => {
        //         const source = layer.getSource();
        //         if (!source) {
        //             return false;
        //         }
        //         if (!(source instanceof VectorSource)) {
        //             return false;
        //         }
        //         feature = source.getFeatureById(featureId);
        //         if (feature) {
        //             return true;
        //         } else {
        //             return false;
        //         }
        //     });
        //     if (feature) {
        //         // 特定のFeatureが指定されている場合は、そこにfitさせる
        //         const ext = feature.getGeometry()?.getExtent();
        //         if (ext) {
        //             const itemId = feature.getId() as string;
        //             mapRef.current?.getView().fit(ext, {
        //                 duration: 1000,
        //                 callback: () => {
        //                     // ポップアップ表示
        //                     dispatch(openItemContentsPopup([{
        //                         type: 'item',
        //                         itemId,
        //                     }]));
        //                 }
        //             });

        //             // fitしおわったらクエリから除去
        //             searchParams.delete('feature');
        //             setSearchParams(searchParams);
        //         }
        //     }
        // }

    }, [geoJsonItems, getGeocoderFeature]);

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
                mapStyleHook.setTrackLayer(targetLayer);
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

    return (
        <div className={styles.Container}>
            <div ref={myRef} className={`${styles.Chart} ${optionClassName}`} />
            {mapRef.current !== null &&
                (
                    <>
                        <PopupContainer map={mapRef.current} />
                        <LandNameOverlay map={mapRef.current} />
                        <DrawController map={mapRef.current} onStart={()=>{isDrawing.current=true}} onEnd={()=>{isDrawing.current=false}} />
                    </>
                )
            }
        </div>
    )
}