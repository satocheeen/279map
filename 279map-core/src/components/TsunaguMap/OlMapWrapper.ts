import { Feature, Map as OlMap, View } from 'ol';
import * as olControl from 'ol/control';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { defaults } from 'ol/interaction'
import { LayerType, LayerKey, StaticLayerType, VectorLayerMap } from './VectorLayerMap';
import GeoJSON from 'ol/format/GeoJSON';
import prefJson from './pref.json';
import { Vector as VectorSource } from "ol/source";
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import VectorLayer from "ol/layer/Vector";
import Style, { StyleFunction } from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { FeatureType, GeocoderId, ItemDefine, MapKind } from '../../279map-common';
import BaseEvent from 'ol/events/Event';
import * as MapUtility from '../../util/MapUtility';
import { GeoJsonObject } from 'geojson';
import { FeatureProperties } from '../../entry';

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
    initialize(mapKind: MapKind) {
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
            this._map.setLayers(layers);
            extent = prefSource.getExtent();

        } else {
            // 背景レイヤ
            this.addLayer(StaticLayerType.VirtualTopography);

            // アイテムレイヤ
            this.addLayer(StaticLayerType.VirtualItem);
        }

        this._map.getView().setMaxZoom(mapKind === MapKind.Virtual ? 10 : 18);
        this.fit(extent);
    }

    _getLayerKey(item: ItemDefine): LayerKey | StaticLayerType {
        if (this._mapKind === MapKind.Real) {
            if (item.geoProperties.featureType === FeatureType.TRACK) {
                return {
                    id: item.dataSourceId,
                    layerType: LayerType.Trak,
                    zoomLv: {
                        min: item.geoProperties.min_zoom,
                        max: item.geoProperties.max_zoom,
                    }
                };
            } else {
                const layerType: LayerType = item.geoProperties.featureType === FeatureType.STRUCTURE ? LayerType.Cluster : LayerType.Normal;
                return {
                    id: item.dataSourceId,
                    layerType,
                };
            }

        } else {
            if (item.geoProperties?.featureType === FeatureType.STRUCTURE) {
                return StaticLayerType.VirtualItem;
            } else {
                return StaticLayerType.VirtualTopography;
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
        feature.setId(def.id);

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
        const source = (() => {
            const layerKey = this._getLayerKey(def);
            const target =  this._vectorLayerMap.getSource(layerKey);
            if (target) {
                return target;
            }
            this.addLayer(layerKey);
            return this._vectorLayerMap.getSource(layerKey);
        })();

        if (!source) {
            console.warn('追加対象レイヤ見つからず', def);
            return;
        }

        const existFeature = source.getFeatureById(def.id);
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
        const layerKey = this._getLayerKey(item);
        const source = this._vectorLayerMap.getSource(layerKey);
        if (!source) {
            console.warn('対象sourceなし');
            return;
        }
        const feature = source.getFeatureById(item.id);
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

    addLayer(layerKey: LayerKey | StaticLayerType) {
        console.log('addLayer', this._id, layerKey);
        const layer = this._vectorLayerMap.createLayer(layerKey);
        this._map.addLayer(layer);
    }

    getLayerLength(): number {
        return this._vectorLayerMap.length();
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

    dispose() {
        this._map.dispose();
        instansMap.delete(this._id);
        console.log('dispose OlMapWrapper', this._id);
    }
}