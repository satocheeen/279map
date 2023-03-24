import { Cluster, Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import Feature, { FeatureLike } from "ol/Feature";
import { Geometry } from "ol/geom";

export enum LayerStyle {
    ClusterItem,
    Topography,
}
export enum StaticLayer {
    VirtualItem,
    VirtualTopography,
    DrawingItem,
    DrawingTopography,
}
export type MapKey = string | StaticLayer;

type LayerInfo = {
    layer: VectorLayer<VectorSource>;
    style: LayerStyle;
}
/**
 * VectorレイヤとVectorソースを一元管理するクラス
 */
export class VectorLayerMap {
    _layerMap: Map<MapKey, LayerInfo>;

    constructor() {
        this._layerMap = new Map<MapKey, LayerInfo>();
    }

    createLayer(id: MapKey, style: LayerStyle) {
        if (this._layerMap.has(id)) {
            console.warn('already exist layer', id);
            return this._layerMap.get(id)?.layer as VectorLayer<VectorSource>;
        }

        const source = new VectorSource();
        let layer: VectorLayer<VectorSource | Cluster>;
        if (style === LayerStyle.ClusterItem) {
            const clusterSource = new Cluster({
                distance: 80,
                minDistance: 20,
                source,
            });
            layer = new VectorLayer({
                source: clusterSource,
                zIndex: 10,
                renderBuffer: 200,
                properties: {
                    name: id,
                },
            })
        
        } else {
            layer = new VectorLayer({
                source,
                // zIndex: 2,
                properties: {
                    name: id,
                },
            });
    
        }
        this._layerMap.set(id, {
            layer,
            style,
        });
        return layer;
    }

    getLayer(id: MapKey) {
        return this._layerMap.get(id)?.layer;
    }

    getSource(id: MapKey) {
        const source = this._layerMap.get(id)?.layer.getSource();
        if (source instanceof Cluster) {
            return source.getSource();
        } else {
            return source;
        }
    }

    getTheStyleLayers(style: LayerStyle) {
        const list = [] as VectorLayer<VectorSource>[];
        this._layerMap.forEach((val) => {
            if (val.style === style) {
                list.push(val.layer);
            }
        })
        return list;
    }

    /**
     * 指定のfeatureを含んでいるsourceを返す
     * @param feature 
     */
    getSourceContainedTheFeature(feature: Feature<Geometry>) {
        let hit: VectorSource | undefined;
        this._layerMap.forEach((val) => {
            const source = val.layer.getSource();
            if (source?.hasFeature(feature)) {
                hit = source;
            }
        });
        return hit;
    }

    /**
     * 
     * @param featureId 
     * @returns 
     */
    getFeatureById(featureId: string) {
        // TODO: Cluster考慮
        let hit: Feature<Geometry> | undefined;
        this._layerMap.forEach((val) => {
            const source = val.layer.getSource();
            const feature = source?.getFeatureById(featureId);
            if (feature) {
                hit = feature;
            }
        });
        return hit;
    }

    clear() {
        this._layerMap.forEach((val) => {
            val.layer.dispose();
        })
        this._layerMap.clear();
    }

    setClusterDistance(distance: number, minDistance: number) {
        this._layerMap.forEach((val) => {
            const source = val.layer.getSource();
            if (source instanceof Cluster) {
                source.setDistance(distance);
                source.setMinDistance(minDistance);
            }
        });
    }

    length(): number {
        return this._layerMap.keys.length;
    }
}
