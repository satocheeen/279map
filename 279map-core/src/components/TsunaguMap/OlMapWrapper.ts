import { Feature, Map as OlMap, View } from 'ol';
import * as olControl from 'ol/control';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { defaults } from 'ol/interaction'
import { LayerStyle, MapKey, StaticLayer, VectorLayerMap } from './VectorLayerMap';
import GeoJSON from 'ol/format/GeoJSON';
import prefJson from './pref.json';
import { Vector as VectorSource } from "ol/source";
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import VectorLayer from "ol/layer/Vector";
import Style, { StyleFunction } from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { FeatureType, ItemDefine, MapKind } from '../../279map-common';
import BaseEvent from 'ol/events/Event';
import * as MapUtility from '../../util/MapUtility';

const instansMap = new Map<string, OlMapWrapper>();

/**
 * OlMapWrapperんスタンスを生成する
 * @param id instanceを特定するID
 * @param target 地図を配置するDivElement。MapChartContextの初期値を仮設定するために、undefinedを許容している。
 * @returns OlMapWrapperインスタンス
 */
export function createMapInstance(id: string, target: HTMLDivElement | undefined) {
    if (instansMap.has(id)) {
        console.warn('already created map');
        return instansMap.get(id) as OlMapWrapper;
    }
    const map = new OlMapWrapper(id, target);
    instansMap.set(id, map);
    return map;
}
export class OlMapWrapper {
    _id: string;
    _map: OlMap;
    _vectorLayerMap: VectorLayerMap;
    _mapKind: MapKind | undefined;
    _currentZoom: number;   // Zoomレベル変更検知用に保持

    constructor(id: string, target: HTMLDivElement | undefined) {
        this._id = id;
        this._vectorLayerMap = new VectorLayerMap();

        const map = new OlMap({
            target,
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
            console.log('日本地図セット')

        } else {
            // 背景レイヤ
            this.addLayer(StaticLayer.VirtualTopography, LayerStyle.Topography);

            // アイテムレイヤ
            this.addLayer(StaticLayer.VirtualItem, LayerStyle.ClusterItem);
            console.log('村マップセット')
        }

        this._map.getView().setMaxZoom(mapKind === MapKind.Virtual ? 10 : 18);
        this.fit(extent);
    }

    addFeature(def: ItemDefine, feature: Feature<Geometry>) {
        if (!this._mapKind) {
            console.warn('mapKind not found.');
            return;
        }

        // 追加対象のSourceを取得
        const source = (() => {
            const geom = feature.getGeometry();
            if (!geom) {
                return;
            }

            if (this._mapKind === MapKind.Real) {
                // Cluster
                const target =  this._vectorLayerMap.getSource(def.dataSourceId);
                if (target) {
                    return target;
                }
                if (geom.getType() === 'Point') {
                    console.log('add layer');
                    this.addLayer(def.dataSourceId, LayerStyle.ClusterItem);
                    return this._vectorLayerMap.getSource(def.dataSourceId);
                } else {
                    console.log('add layer');
                    this.addLayer(def.dataSourceId, LayerStyle.Topography);
                    return this._vectorLayerMap.getSource(def.dataSourceId);
                }
            } else {
                // 村マップ
                switch(def.geoProperties?.featureType as FeatureType) {
                    case FeatureType.STRUCTURE:
                        return this._vectorLayerMap.getSource(StaticLayer.VirtualItem);
                    default:
                        return this._vectorLayerMap.getSource(StaticLayer.VirtualTopography);
                }
            }
        })();

        if (!source) {
            console.warn('追加対象レイヤ見つからず', def);
            return;
        }

        const existFeature = source.getFeatureById(def.id);
        if (existFeature) {
            if (existFeature.getProperties()['lastEditedTime'] !== def.lastEditedTime) {
                console.log('update feature');
                existFeature.setGeometry(feature.getGeometry());
                existFeature.setProperties(feature.getProperties());
            }
        } else {
            console.log('add feature', feature.getGeometry()?.getType(), source.getProperties());
            source.addFeature(feature);
        }
    }

    /**
     * the map view fit on the extent
     * @param ext fit area
     */
    fit(ext: Extent) {
        const currentZoom = this._map.getView().getZoom();
        this._map.getView().fit(ext, {
            padding: [10, 10, 10, 10],
            maxZoom: currentZoom,
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

    addLayer(id: MapKey, style: LayerStyle) {
        const layer = this._vectorLayerMap.createLayer(id, style);
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
        this._vectorLayerMap.getTheStyleLayers(LayerStyle.ClusterItem).forEach(layer => {
            console.log('set point style', layer.getSource()?.getFeatures().length)
            layer.setStyle(style);
        })
    }

    /**
     * TopographyLayer（村マップの地形, RealMapでのポイント以外）のスタイルを設定する
     * @param style 
     */
    setTopographyLayerStyle(style: StyleFunction) {
        this._vectorLayerMap.getTheStyleLayers(LayerStyle.Topography).forEach(layer => {
            console.log('set topography style', layer.getSource()?.getFeatures().length)
            layer.setStyle(style);
        })
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
    }
}