import { Feature, MapBrowserEvent, Map as OlMap, Overlay, View } from 'ol';
import * as olControl from 'ol/control';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { Interaction, defaults } from 'ol/interaction'
import { LayerType, MyLayerDefine, VectorLayerMap } from './VectorLayerMap';
import GeoJSON from 'ol/format/GeoJSON';
import prefJson from './pref.json';
import { Cluster, Vector as VectorSource } from "ol/source";
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import VectorLayer from "ol/layer/Vector";
import Style, { StyleFunction } from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { DataId, FeatureType, GeocoderId, ItemDefine, MapKind } from '../../279map-common';
import BaseEvent from 'ol/events/Event';
import * as MapUtility from '../../util/MapUtility';
import { GeoJsonObject } from 'geojson';
import { FeatureProperties } from '../../entry';
import { Pixel } from 'ol/pixel';
import { convertDataIdFromFeatureId, getMapKey } from '../../store/data/dataUtility';
import { DataSourceInfo, SourceKind } from 'tsunagumap-api';

const instansMap = new Map<string, OlMapWrapper>();
type Param = {
    id: string; // instanceを特定するID
    target?: HTMLDivElement;    // 地図を配置するDivElement。MapChartContextの初期値を仮設定するために、undefinedを許容している。
    getGeocoderFeature?: (id: GeocoderId) => Promise<GeoJsonObject>;    // 外部から図形を取得するためのAPIFunction
}
/**
 * OlMapWrapperんスタンスを生成する
 * @param id instanceを特定するID
 * @param target 地図を配置するDivElement。MapChartContextの初期値を仮設定するために、undefinedを許容している。
 * @returns OlMapWrapperインスタンス
 */
export function createMapInstance(param: Param) {
    if (instansMap.has(param.id)) {
        console.warn('already created map');
        return instansMap.get(param.id) as OlMapWrapper;
    }
    const map = new OlMapWrapper(param);
    instansMap.set(param.id, map);
    return map;
}

export function getMapInstance(id: string) {
    return instansMap.get(id);
}
export class OlMapWrapper {
    _id: string;
    _map: OlMap;
    _vectorLayerMap: VectorLayerMap;
    _mapKind?: MapKind;
    _currentZoom: number;   // Zoomレベル変更検知用に保持
    _getGeocoderFeature?: (id: GeocoderId) => Promise<GeoJsonObject>;

    // 描画用レイヤ
    _drawingLayer = new VectorLayer<VectorSource>({
        source: new VectorSource(),
        zIndex: 100,
    });

    constructor(param: Param) {
        this._id = param.id;
        this._vectorLayerMap = new VectorLayerMap();
        console.log('create OlMapWrapper', param.id);

        const map = new OlMap({
            target: param.target,
            controls: olControl.defaults({attribution: true}),
            view: new View({
                projection: 'EPSG:4326',
                maxZoom: 20,
            }),
            interactions: defaults({ doubleClickZoom: false }),
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
    }

    _onZoomLvChanged() {
        // change Cluster Distance Setting
        const resolution = this._map.getView().getResolution();
        if (!resolution) return;
        const structureScale = MapUtility.getStructureScale(resolution);
        this._vectorLayerMap.setClusterDistance(80 * structureScale, 20 * structureScale);
    }

    /**
     * 地図種別に対応した初期レイヤを設定する
     */
    initialize(mapKind: MapKind, dataSources: DataSourceInfo[]) {
        this._mapKind = mapKind;
        let extent: Extent =  [0, 0, 2, 2];
        if (mapKind === MapKind.Real) {
            // 都道府県レイヤ
            const features = new GeoJSON().readFeatures(prefJson);
            const prefSource = new VectorSource({ features });

            const layers = [
                new TileLayer({
                    source: new OSM(),
                    zIndex: 0,
                    minZoom: 10,
                }),
                // 都道府県レイヤ
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
            extent = prefSource.getExtent();

            dataSources.forEach(ds => {
                if (ds.kind === SourceKind.Track) {
                    [[1, 8], [8, 13], [13, 21]].forEach(zoomLv => {
                        const layerDefine: MyLayerDefine = {
                            type: 'MyLayer',
                            dataSourceId: ds.dataSourceId,
                            editable: false,
                            layerType: LayerType.Track,
                            zoomLv: {
                                min: zoomLv[0],
                                max: zoomLv[1],
                            }
                        };
                        this.addLayer(layerDefine);
                    })

                } else if (ds.kind === SourceKind.Item) {
                    [LayerType.Point, LayerType.Topography].forEach(layerType => {
                        const layerDefine: MyLayerDefine = {
                            type: 'MyLayer',
                            dataSourceId: ds.dataSourceId,
                            editable: ds.editable,
                            layerType: layerType as LayerType.Point| LayerType.Topography,
                        };
                        this.addLayer(layerDefine);
                    })
                }
            })

        } else {
            // 村マップ
            dataSources.forEach(ds => {
                if (ds.kind !== SourceKind.Item) {
                    return;
                }
                [LayerType.Point, LayerType.Topography].forEach(layerType => {
                    const layerDefine: MyLayerDefine = {
                        type: 'MyLayer',
                        dataSourceId: ds.dataSourceId,
                        editable: ds.editable,
                        layerType: layerType as LayerType.Point| LayerType.Topography,
                    };
                    this.addLayer(layerDefine);
                })
            });
        }

        this._map.getView().setMaxZoom(mapKind === MapKind.Virtual ? 10 : 18);
        this.fit(extent);
    }

    /**
     * 指定のitemが属するVectorSourceを返す
     * @param item 
     */
    _getTargetSource(item: ItemDefine): VectorSource | undefined {
        const layerInfos = this._vectorLayerMap.getLayerInfoOfTheDataSource(item.id.dataSourceId);
        if (item.geoProperties.featureType === FeatureType.TRACK) {
            const minZoomLv = item.geoProperties.min_zoom;
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

    async _createFeatureGeometryFromItemDefine(def: ItemDefine): Promise<Feature<Geometry> | undefined> {
        let feature: Feature<Geometry>;
        if (def.geoProperties?.featureType === FeatureType.AREA && ('geocoderId' in def.geoProperties && def.geoProperties.geocoderId)) {
            // Geocoderの図形の場合は、Geocoder図形呼び出し
            if (!this._getGeocoderFeature) {
                console.warn('getGeocoderFeature not set');
                return;
            }
            const geoJson = await this._getGeocoderFeature(def.geoProperties.geocoderId);
            feature = new GeoJSON().readFeatures(geoJson)[0];

        } else {
            feature = MapUtility.createFeatureByGeoJson(def.geoJson, def.geoProperties);
        }
        if (!feature) {
            console.warn('contents could not be loaded.', def.id, JSON.stringify(def));
            return;
        }
        feature.setId(getMapKey(def.id));

        const properties = Object.assign({}, def.geoProperties ? def.geoProperties : {}, {
            name: def.name,
            lastEditedTime: def.lastEditedTime,
        }) as FeatureProperties;
        feature.setProperties(properties);

        return feature;
    }

    async addFeature(def: ItemDefine) {
        if (!this._mapKind) {
            console.warn('mapKind not found.');
            return;
        }

        const feature = await this._createFeatureGeometryFromItemDefine(def);
        if (!feature) {
            return;
        }
        const geom = feature.getGeometry();
        if (!geom) {
            return;
        }

        // 追加対象のSourceを取得
        const source = this._getTargetSource(def);

        if (!source) {
            console.warn('追加対象レイヤ見つからず', def);
            return;
        }

        const existFeature = source.getFeatureById(def.id.id);
        if (existFeature) {
            if (existFeature.getProperties()['lastEditedTime'] !== def.lastEditedTime) {
                console.log('update feature');
                existFeature.setGeometry(geom);
                existFeature.setProperties(feature.getProperties());
            }
        } else {
            source.addFeature(feature);
            console.log('add feature', geom.getType(), source.getProperties(), source.getFeatures().length);
        }
    }

    removeFeature(item: ItemDefine) {
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

    /**
     * the map view fit on the extent
     * @param ext fit area
     */
    fit(ext: Extent) {
        const currentZoom = this._map.getView().getZoom();
        this._map.getView().fit(ext, {
            padding: [10, 10, 10, 10],
            // maxZoom: currentZoom,
        });
        console.log('fit', ext);
    }

    showDrawingLayer(style: StyleFunction | Style) {
        this._drawingLayer.setStyle(style);
        this._map.addLayer(this._drawingLayer);
    }
    hideDrawingLayer() {
        this._drawingLayer.getSource()?.clear();
        this._drawingLayer.setStyle();
        this._map.removeLayer(this._drawingLayer);
    }
    getDrawingLayer() {
        return this._drawingLayer;
    }

    getFeatureById(itemId: string): Feature<Geometry> | undefined {
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

    addLayer(layerDefine: MyLayerDefine): VectorLayer<VectorSource> {
        console.log('addLayer', this._id, layerDefine);
        const layer = this._vectorLayerMap.createLayer(layerDefine);
        this._map.addLayer(layer);
        return layer;
    }

    removeLayer(layerDefine: MyLayerDefine) {
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
    getLayersOfTheType(layerType: LayerType): VectorLayer<VectorSource>[] {
        return this._vectorLayerMap.getLayersOfTheType(layerType);
    }

    getSourceContainedTheFeature(feature: Feature<Geometry>) {
        return this._vectorLayerMap.getSourceContainedTheFeature(feature);
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

    addListener(type: 'moveend', listener: (event: BaseEvent) => void) {
        this._map.on(type, listener);
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
    on(event: 'click'|'pointermove', listener: (evt: MapBrowserEvent<any>) => void) {
        this._map.on(event, listener);
    }
    un(event: 'click'|'pointermove', listener: (evt: MapBrowserEvent<any>) => void) {
        this._map.un(event, listener);
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
    getNearlyFeatures(pixel: Pixel): DataId[] {
        const points = [] as DataId[];
        this._map.forEachFeatureAtPixel(pixel, (feature, layer) => {
            const layerInfo = this._vectorLayerMap.getLayerInfo(layer);
            if (!layerInfo) return;
            if (layerInfo.layerType === LayerType.Point) {
                console.log('layerInfo', layerInfo);
                console.log('feature', feature);
                const features = feature.get('features') as Feature[];
                features.forEach(f => {
                    const dataId = convertDataIdFromFeatureId(f.getId() as string);
                    points.push(dataId);
                });
            } else {
                const dataId = convertDataIdFromFeatureId(feature.getId() as string);
                points.push(dataId);
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

    dispose() {
        this._map.dispose();
        instansMap.delete(this._id);
        console.log('dispose OlMapWrapper', this._id);
    }
}