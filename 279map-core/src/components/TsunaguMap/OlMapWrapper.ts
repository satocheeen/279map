import { Feature, MapBrowserEvent, Map as OlMap, Overlay, View } from 'ol';
import * as olControl from 'ol/control';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { Interaction, defaults } from 'ol/interaction'
import { LayerInfo, LayerType, LayerDefine, VectorLayerMap } from './VectorLayerMap';
import GeoJSON from 'ol/format/GeoJSON';
import prefJson from './pref.json';
import { Cluster, Vector as VectorSource, XYZ } from "ol/source";
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import VectorLayer from "ol/layer/Vector";
import Style, { StyleFunction } from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import BaseEvent from 'ol/events/Event';
import * as MapUtility from '../../util/MapUtility';
import { FeatureProperties, ItemInfo, TsunaguMapHandler } from '../../types/types';
import { Pixel } from 'ol/pixel';
import { convertDataIdFromFeatureId, getMapKey } from '../../util/dataUtility';
import { FitOptions } from 'ol/View';
import { Coordinate } from 'ol/coordinate';
import { GetGeocoderFeatureDocument, ItemDatasourceInfo } from '../../graphql/generated/graphql';
import { Client } from 'urql';
import { DataId, DatasourceLocationKindType, FeatureType, MapKind } from '../../types-common/common-types';
import PointStyleMap from '../map/PointStyleMap';
import { StaticImageLayerMap } from './StaticImageLayerMap';

export type FeatureInfo = {
    id: DataId;
    feature: Feature<Geometry>;
}
export type UpdateLayerVisibleParam = {
    datasourceId: string;
    visible: boolean;
}[];

type Device = 'pc' | 'sp';

const pcControls = olControl.defaults({attribution: true, zoom: false});
const spControls = olControl.defaults({attribution: true, zoom: false});

const MAX_ZOOM_REAL = 20;
const MAX_ZOOM_VIRTUAL = 10;
// export const TemporaryPointLayerDatasourceId = 'temporary-point';

// OpenStreetMap
const OpenLayersTile = new TileLayer({
    source: new OSM(),
    zIndex: 0,
    minZoom: 10,
    visible: true,
});

// 国土地理院
const CyberjapanTile = new TileLayer({
    source: new XYZ({
        url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
        attributions: "国土地理院(https://maps.gsi.go.jp/development/ichiran.html)",
        projection: "EPSG:3857"
    }),
    zIndex: 0,
    minZoom: 10,
    visible: false,
});

// 国土地理院（衛星画像）
const CyberjapanPhotoTile = new TileLayer({
    source: new XYZ({
        url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        attributions: "国土地理院(https://maps.gsi.go.jp/development/ichiran.html)",
        projection: "EPSG:3857"
    }),
    zIndex: 0,
    minZoom: 10,
    visible: false,
});
const BackgroundTileLayers = [OpenLayersTile, CyberjapanTile, CyberjapanPhotoTile];

/**
 * OpenLayersの地図を内包したクラス。
 * 当該システムで必要な機能を実装している。
 */
export class OlMapWrapper {
    readonly _id: string;
    _map: OlMap;
    _vectorLayerMap: VectorLayerMap;
    _staticImageLayerMap = new StaticImageLayerMap(this);
    _mapKind?: MapKind;
    _currentZoom: number;   // Zoomレベル変更検知用に保持
    _device: Device = 'pc';
    _gqlClient: Client;
    pointStyleMap = new PointStyleMap();

    // 描画用レイヤ
    _drawingLayers: VectorLayer<VectorSource>[] = [];

    constructor(id: string, target: HTMLDivElement, device: Device, gqlClient: Client) {
        this._id = id;
        this._vectorLayerMap = new VectorLayerMap();
        this._gqlClient = gqlClient;
        console.log('create OlMapWrapper', this._id);

        const map = new OlMap({
            target,
            view: new View({
                projection: 'EPSG:4326',
            }),
            interactions: defaults({ doubleClickZoom: false, pinchRotate: false, shiftDragZoom: false }),
        });

        // cancel right click
        map.getViewport().addEventListener('contextmenu', (evt) => {
            evt.preventDefault();
        });

        this._map = map;
        this._currentZoom = map.getView().getZoom() ?? 0;

        map.on('moveend', () => {
            const zoom = map.getView().getZoom() ?? 0;
            if (this._currentZoom !== zoom) {
                this._onZoomLvChanged();
            }
        })

        this.changeDevice(device);
    }

    get container() {
        return this._map.getTarget() as HTMLDivElement;
    }

    changeDevice(device: Device) {
        this._device = device;

        for (const ctl of this._map.getControls().getArray()) {
            this._map.removeControl(ctl);
        }
        if (this._device === 'pc') {
            pcControls.forEach(ctl => {
                this._map.addControl(ctl)
            })
        } else {
            spControls.forEach(ctl => {
                this._map.addControl(ctl)
            })
        }
    }

    _onZoomLvChanged() {
        // change Cluster Distance Setting
        const resolution = this._map.getView().getResolution();
        if (!resolution) return;
        const isMax = this._map.getView().getZoom() === this._map.getView().getMaxZoom();
        if (isMax || this._mapKind === MapKind.Virtual) {
            // 最大Zoom時or村マップでは、まとめない
            this._vectorLayerMap.setClusterDistance(0, 0);
        } else {
            const structureScale = MapUtility.getStructureScale(resolution, this._mapKind);
            this._vectorLayerMap.setClusterDistance(80 * structureScale, 20 * structureScale);
        }
    }

    /**
     * 地図種別に対応した初期レイヤを設定する
     */
    initialize({mapKind, itemDataSources, fitExtent, isWorldMap}: {mapKind: MapKind, itemDataSources: ItemDatasourceInfo[], fitExtent?: Extent, isWorldMap?: boolean}) {
        this._mapKind = mapKind;
        let extent = fitExtent;
        if (mapKind === MapKind.Real) {
            if (isWorldMap) {
                // 世界地図
                const layers = [
                    new TileLayer({
                        source: new OSM(),
                        zIndex: 0,
                        // minZoom: 10,
                    })
                ];
                this._map.setLayers(layers);

            } else {
                // 日本地図
                // 都道府県レイヤ
                const features = new GeoJSON().readFeatures(prefJson);
                const prefSource = new VectorSource({ features });
                if (!extent || extent.every(v => v===0)) {
                    // extent未指定の場合は、日本地図の範囲を設定
                    extent = prefSource.getExtent();
                }

                const layers = [
                    ...BackgroundTileLayers,
                    new VectorLayer({
                        source: prefSource,
                        maxZoom: 10,
                        zIndex: 0,
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
                this._map.setLayers(layers);

                // 日本地図に収まる範囲にパンニング可能範囲を制御
                const view = new View({
                    projection: this._map.getView().getProjection(),
                    center: this._map.getView().getCenter(),
                    zoom: this._map.getView().getZoom(),
                    minZoom: this._map.getView().getMinZoom(),
                    // maxZoom: this._map.getView().getMaxZoom(),
                    extent: prefSource.getExtent(),
                });
                this._map.setView(view);
    
            }

            itemDataSources.forEach(ds => {
                if (ds.config.kind === DatasourceLocationKindType.Track) {
                    [[1, 8], [8, 13], [13, 21]].forEach(zoomLv => {
                        const layerDefine: LayerDefine = {
                            dataSourceId: ds.datasourceId,
                            editable: false,
                            layerType: LayerType.Track,
                            zoomLv: {
                                min: zoomLv[0],
                                max: zoomLv[1],
                            }
                        };
                        this._addLayer(layerDefine, ds.initialVisible);
                    })

                } else if (ds.config.kind === DatasourceLocationKindType.RealItem) {
                    [LayerType.Point, LayerType.Topography].forEach(layerType => {
                        const layerDefine: LayerDefine = {
                            dataSourceId: ds.datasourceId,
                            editable: true,
                            layerType: layerType as LayerType.Point| LayerType.Topography,
                        };
                        this._addLayer(layerDefine, ds.initialVisible);
                    })

                } else if (ds.config.kind === DatasourceLocationKindType.StaticImage) {
                    this._staticImageLayerMap.createLayer({
                        datasourceId: ds.datasourceId,
                        editable: true,
                    })
                }

            })

        } else {
            // 村マップ
            extent ??= [0, 0, 2, 2];
            itemDataSources.forEach(ds => {
                if (ds.config.kind !== DatasourceLocationKindType.VirtualItem) {
                    return;
                }
                [LayerType.Point, LayerType.Topography].forEach(layerType => {
                    const layerDefine: LayerDefine = {
                        dataSourceId: ds.datasourceId,
                        editable: true,
                        layerType: layerType as LayerType.Point| LayerType.Topography,
                    };
                    this._addLayer(layerDefine, ds.initialVisible);
                })
            });

            // パンニング可能範囲の制御解除
            const view = new View({
                projection: this._map.getView().getProjection(),
                center: this._map.getView().getCenter(),
                zoom: this._map.getView().getZoom(),
                minZoom: this._map.getView().getMinZoom(),
                maxZoom: this._map.getView().getMaxZoom(),
                extent: undefined,
            });
            this._map.setView(view);
            this._vectorLayerMap.setClusterDistance(0, 0);

        }

        // // 一時レイヤを用意
        // this.addLayer({
        //     dataSourceId: TemporaryPointLayerDatasourceId,
        //     editable: false,
        //     layerType: LayerType.Point,
        // }, true);

        this._map.getView().setMaxZoom(mapKind === MapKind.Virtual ? MAX_ZOOM_VIRTUAL : MAX_ZOOM_REAL);
        if (extent) {
            this.fit(extent);
        }
    }

    /**
     * 指定のitemが属するVectorSourceを返す
     * @param item 
     */
    _getTargetSource(item: ItemInfo): VectorSource | undefined {
        const layerInfos = this._vectorLayerMap.getLayerInfoOfTheDataSource(item.datasourceId);
        if (item.geoProperties.featureType === FeatureType.TRACK) {
            const minZoomLv = item.geoProperties .min_zoom;
            const maxZoomLv = item.geoProperties.max_zoom;
            const target = layerInfos.find(info => {
                if (info.layerType !== LayerType.Track) {
                    return false;
                }
                return info.zoomLv.min === minZoomLv && info.zoomLv.max === maxZoomLv;
            });
            return target?.layer.getSource() ?? undefined;
        } else {
            const target = layerInfos.find(info => {
                if (item.geoProperties.featureType === FeatureType.STRUCTURE) {
                    return info.layerType === LayerType.Point;
                } else {
                    return info.layerType === LayerType.Topography;
                }
            });
            if (target?.layerType === LayerType.Point) {
                const clusterSource = target.layer.getSource() as Cluster;
                return clusterSource.getSource() ?? undefined;
            } else {
                return target?.layer.getSource() ?? undefined;
            }
        }
    }

    _createFeatureGeometryFromItemDefine(def: ItemInfo): Feature<Geometry> | undefined {
        const feature = MapUtility.createFeatureByGeoJson(def.geometry, def.geoProperties);
        feature.setId(getMapKey(def.id));

        if (def.geoProperties?.featureType === FeatureType.AREA && ('geocoderId' in def.geoProperties && def.geoProperties.geocoderId)) {
            // Geocoderの図形の場合は、Geocoder図形呼び出して後から差し替える

            // 仮設定ジオメトリ（矩形）は非表示
            feature.setStyle(new Style());

            this._gqlClient.query(GetGeocoderFeatureDocument, {
                id: def.geoProperties.geocoderId,
            })
            .then((result => {
                const geometry = result.data?.getGeocoderFeature;
                // 呼び出し完了後に差し替え
                const newFeature = new GeoJSON().readFeatures(geometry)[0];
                feature.setGeometry(newFeature.getGeometry());
                feature.setStyle();
            }))
        }

        const properties = Object.assign({}, def.geoProperties ? def.geoProperties : {}, {
            name: def.name,
            lastEditedTime: def.lastEditedTime,
        }) as FeatureProperties;
        feature.setProperties(properties);

        return feature;
    }

    addFeatures(defs: ItemInfo[]) {
        if (!this._mapKind) {
            console.warn('mapKind not found.');
            return;
        }

        // 追加対象のソースが同一のものをまとめる
        const sourceDefMap = new Map<VectorSource, Feature<Geometry>[]>();
        const staticImageItems: ItemInfo[] = [];
        for (const def of defs) {
            if (this._staticImageLayerMap.has(def.datasourceId)) {
                staticImageItems.push(def);
                continue;
            }

            const source = this._getTargetSource(def);
            if (!source) {
                console.warn('追加対象レイヤ見つからず', def);
                continue;
            }
            const feature = this._createFeatureGeometryFromItemDefine(def);
            if (!feature) {
                continue;
            }
            const geom = feature.getGeometry();
            if (!geom) {
                continue;
            }

            const existFeature = source.getFeatureById(getMapKey(def.id));
            if (existFeature) {
                existFeature.setGeometry(geom);
                const properties = Object.assign({}, feature.getProperties(), def.geoProperties ? def.geoProperties : {}, {
                    name: def.name,
                    lastEditedTime: def.lastEditedTime,
                }) as FeatureProperties;
                existFeature.setProperties(properties);
                continue;
            }
    
            // 追加対象featureをmapに追加格納
            if (!sourceDefMap.has(source)) {
                sourceDefMap.set(source, []);
            }
            sourceDefMap.get(source)?.push(feature);
        }

        sourceDefMap.forEach((features, source) => {
            console.log('add features', features.length);
            source.addFeatures(features);
        })

        staticImageItems.forEach(def => {
            this._staticImageLayerMap.addFeature(def);
        })
    }

    removeFeature(item: ItemInfo) {
        const source = this._getTargetSource(item);
        if (!source) {
            console.warn('対象sourceなし');
            return;
        }
        const feature = source.getFeatureById(getMapKey(item.id));
        if (!feature) {
            console.warn('削除対象が該当sourceに存在しない', item.id);
            return;
        }
        source.removeFeature(feature);
    }

    _fitting = false;
    _fitReserve: undefined | {ext: Extent; options: FitOptions};
    /**
     * the map view fit on the extent
     * @param ext fit area
     */
    async fit(ext: Extent, opt?: {animation?: boolean, zoom?: boolean}) {
        return new Promise<void>((resolve) => {
            const maxZoom = (opt?.zoom === undefined || opt.zoom) ? undefined : this._map.getView().getZoom();
            const options: FitOptions = {
                padding: [100, 100, 100, 100],
                duration: opt?.animation ? 500 : undefined,
                maxZoom,
                callback: () => {
                    // 連続実行制御
                    this._fitting = false;
                    if (this._fitReserve) {
                        this._map.getView().fit(this._fitReserve.ext, this._fitReserve.options);
                        this._fitReserve = undefined;
                    }
                    resolve();
                }
            };
            if (this._fitting) {
                // 連続fitすると固まるので、fit処理中は待つ
                this._fitReserve = {ext, options};
                this._map.getView().cancelAnimations();
            } else {
                this._fitting = true;
                this._map.getView().fit(ext, options);
            }
        })
    }

    createDrawingLayer(layerType: LayerType, style?: StyleFunction | Style): VectorLayer<VectorSource> {
        const layer = new VectorLayer<VectorSource>({
            source: new VectorSource(),
            zIndex: layerType === LayerType.Topography ? 8 : 20,  // 土地の場合は、土地(5), 建物(10)の間になるように。
            properties: {
                type: 'drawing-temporary',
            }
        });
        if (style) {
            layer.setStyle(style);
        }
        this._map.addLayer(layer);
        return layer;
    }
    removeDrawingLayer(layer: VectorLayer<VectorSource>) {
        if (layer.getProperties()['type'] !== 'drawing-temporary') {
            console.warn('this is not a drawing layer.', layer);
            return;
        }
        layer.getSource()?.clear();
        this._map.removeLayer(layer);
    }

    /**
     * 呼び出し元が任意で描画するレイヤを生成する
     */
    createTemporaryLayer(style?: StyleFunction | Style): VectorLayer<VectorSource> {
        const layer = new VectorLayer<VectorSource>({
            source: new VectorSource(),
            zIndex: 50,
            properties: {
                type: 'temporary',
            }
        });
        if (style) {
            layer.setStyle(style);
        }
        this._map.addLayer(layer);
        return layer;
    }
    removeTemporaryLayer(layer: VectorLayer<VectorSource>) {
        if (layer.getProperties()['type'] !== 'temporary') {
            console.warn('this is not a drawing layer.', layer);
            return;
        }
        layer.getSource()?.clear();
        this._map.removeLayer(layer);
    }


    getFeatureById(itemId: DataId): Feature<Geometry> | undefined {
        if (!itemId) {
            // nullやundefinedで入ってくる場合に備えて、ここで弾く。
            return undefined;
        }
        return this._vectorLayerMap.getFeatureById(itemId);
    }

    /**
     * 現在の地図表示範囲のExtentを返す
     * @returns 
     */
    getExtent(): Extent {
        const ext = this._map.getView().calculateExtent();
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

        return ext;
    }

    getZoom(): number | undefined {
        return this._map.getView().getZoom();
    }

    /**
     * レイヤを新規追加する
     * @param layerDefine 
     * @param initialVisible 初期時のvisible
     * @returns 
     */
    _addLayer(layerDefine: LayerDefine, initialVisible: boolean): VectorLayer<VectorSource> | undefined{
        const layer = this._vectorLayerMap.createLayer(layerDefine);
        if (layer) {
            layer.setVisible(initialVisible);
            this._map.addLayer(layer);
        }
        return layer;
    }

    removeLayer(layerDefine: LayerDefine) {
        const layer = this._vectorLayerMap.getLayer(layerDefine);
        if (!layer) {
            console.warn('not exist remove target layer', layerDefine);
            return;
        }
        this._map.removeLayer(layer);
        this._vectorLayerMap.removeLayer(layerDefine);

        return layer;
    }

    getLayerLength(): number {
        return this._vectorLayerMap.length();
    }

    /**
     * 指定のデータソースIDのLayerTypeを返す
     * @param dataSourceId 
     * @return レイヤ種別配列（1データソースが、Pointレイヤ、Topographyレイヤがあったり、Trackの場合は、ズームLvごとのレイヤがあるので、n個）
     */
    getLayerTypeOfTheDataSource(dataSourceId: string): LayerType[] {
        return this._vectorLayerMap.getLayerTypeOfTheDataSource(dataSourceId);
    }
    
    /**
     * 指定のデータソースIDに紐づくレイヤを返す。
     * @param dataSourceId 
     * @return レイヤ配列（Trackの場合は、複数存在しうるので）
     */
    getDataSourceLayers(dataSourceId: string): VectorLayer<VectorSource>[] {
        return this._vectorLayerMap.getDataSourceLayers(dataSourceId);
    }

    /**
     * 指定種別のレイヤ一覧を返す
     * @returns 
     */
    getLayersOfTheType(layerType: LayerType): LayerInfo[] {
        return this._vectorLayerMap.getLayersOfTheType(layerType);
    }

    /**
     * 指定のfeatureを含んでいるレイヤ情報を返す
     * @param feature 
     */
    getLayerInfoContainedTheFeature(feature: Feature<Geometry>): LayerInfo | undefined {
        return this._vectorLayerMap.getLayerInfoContainedTheFeature(feature);
    }

    /**
     * PointLayer(村マップの家、RealMapでの各ポイント)のスタイルを設定する
     * @param style 
     */
    setPointLayerStyle(style: StyleFunction) {
        this._vectorLayerMap.setPointLayerStyle(style);
    }


    /**
     * TopographyLayer（村マップの地形, RealMapでのポイント以外）のスタイルを設定する
     * @param style 
     */
    setTopographyLayerStyle(style: StyleFunction) {
        this._vectorLayerMap.setTopographyLayerStyle(style);
    }

    setTrackLayerStyle(style: StyleFunction) {
        this._vectorLayerMap.setTrackLayerStyle(style);
    }

    on(event: 'click' | 'moveend' | 'pointermove', listener: (evt: MapBrowserEvent<any>) => void): void {
        // @ts-ignore
        this._map.on(event, listener);
    }
    un(event: 'click' | 'moveend' | 'pointermove' | 'loadend', listener: (evt: MapBrowserEvent<any>) => void): void {
        // @ts-ignore
        this._map.un(event, listener);
    }
    once(event: 'loadend', listener: (evt: BaseEvent) => void) {
        return this._map.once(event, listener);
    }
    get currentResolution() {
        return this._map.getView().getResolution() ?? 0;
    }
    getPixelFromCoordinate(coordinate: Coordinate) {
        return this._map.getPixelFromCoordinate(coordinate);
    }
    getCoordinateFromPixel(pixel: Pixel) {
        return this._map.getCoordinateFromPixel(pixel);
    }

    clearAllLayers() {
        console.log('clearAllLayers');
        this._map.getAllLayers().forEach(layer => {
            this._map.removeLayer(layer);
        });
        this._vectorLayerMap.clear();
    }

    addOverlay(overlay: Overlay) {
        this._map.addOverlay(overlay);
    }
    removeOverlay(overlay: Overlay) {
        this._map.removeOverlay(overlay);
    }

    /**
     * 地図Div上のマウスカーソルスタイルを変更する
     * @param style 
     */
    setCursorStyle(style: 'pointer' | '') {
        this._map.getTargetElement().style.cursor = style;
    }

    /**
     * pixel付近に存在するFeatureのIDを返す
     */
    getNearlyFeatures(pixel: Pixel): FeatureInfo[] {
        const points = [] as FeatureInfo[];
        this._map.forEachFeatureAtPixel(pixel, (feature, layer) => {
            const layerInfo = this._vectorLayerMap.getLayerInfo(layer);
            if (!layerInfo) return;
            if (layerInfo.layerType === LayerType.Point) {
                const features = feature.get('features') as Feature[];
                features.forEach(f => {
                    const dataId = convertDataIdFromFeatureId(f.getId() as string);
                    points.push({
                        id: dataId,
                        feature: f,
                    });
                });
            } else {
                const dataId = convertDataIdFromFeatureId(feature.getId());
                points.push({
                    id: dataId,
                    feature: feature as Feature<Geometry>,
                });
            }
        });
        return points;
    }

    addInteraction(interaction: Interaction) {
        this._map.addInteraction(interaction);
    }

    removeInteraction(interaction: Interaction) {
        this._map.removeInteraction(interaction);
    }

    /**
     * レイヤの表示非表示を切り替える
     * @param targets 表示非表示を切り替えるデータソースIDと、切り替え後の表示非表示
     */
    updateLayerVisible(targets: UpdateLayerVisibleParam) {
        targets.forEach(target => {
            const layerInfos = this._vectorLayerMap.getLayerInfoOfTheDataSource(target.datasourceId);
            layerInfos.forEach(layerInfo => {
                const currentVisible = layerInfo.layer.getVisible();
                if (currentVisible !== target.visible) {
                    layerInfo.layer.setVisible(target.visible);
                }
            });
            const staticImageLayers = this._staticImageLayerMap.getLayerOfTheDataSource(target.datasourceId);
            staticImageLayers.forEach(layer => {
                const currentVisible = layer.getVisible();
                if (currentVisible !== target.visible) {
                    layer.setVisible(target.visible);
                }
            })
        })
    }

    /**
     * 背景地図の切り替え
     * @param value 
     */
    switchBackground(value: Parameters<TsunaguMapHandler['switchBackground']>[0]) {
        BackgroundTileLayers.forEach(val => {
            if (value === 'osm') {
                val.setVisible(val === OpenLayersTile);

            } else if (value === 'japan') {
                val.setVisible(val === CyberjapanTile);

            } else {
                val.setVisible(val === CyberjapanPhotoTile);
            }
        })
    }

    dispose() {
        this._map.dispose();
        console.log('dispose OlMapWrapper', this._id);
    }
}

export type OlMapType = InstanceType<typeof OlMapWrapper>;