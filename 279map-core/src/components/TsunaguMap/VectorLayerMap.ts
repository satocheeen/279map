import { Cluster, Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { StyleFunction } from "ol/style/Style";
import Layer from "ol/layer/Layer";

export enum LayerType {
    Normal = 'Normal',
    Cluster = 'Cluster',    // Cluster設定されたレイヤ。Pointのみ追加可能。
    Track = 'Track',         // Track（軌跡）用レイヤ
}
export enum StaticLayerType {
    VirtualItem = 'VirtualItem',
    VirtualTopography = 'VirtualTopography',
    DrawingItem = 'DrawingItem',
    DrawingTopography = 'DrawingTopography',
}
export type LayerKey = {
    id: string;
} & ({
    layerType: LayerType.Cluster | LayerType.Normal;
} | {
    layerType: LayerType.Track;
    zoomLv: {
        min: number;
        max: number;
    }
})

type LayerInfo = LayerKey & {
    layer: VectorLayer<VectorSource>;
}
/**
 * VectorレイヤとVectorソースを一元管理するクラス
 */
export class VectorLayerMap {
    _layerMap: Map<string, LayerInfo>;
    _pointLayerStyle?: StyleFunction;
    _topographyLayerStyle?: StyleFunction;
    _trackLayerStyle?: StyleFunction;

    constructor() {
        this._layerMap = new Map<string, LayerInfo>();
    }

    _convertLayerKeyFromStaticLayerType(slt: StaticLayerType): LayerKey {
        switch(slt) {
            case StaticLayerType.VirtualItem:
                return {
                    id: slt,
                    layerType: LayerType.Cluster
                };
            default:
                return {
                    id: slt,
                    layerType: LayerType.Normal
                }
        }
    }

    /**
     * _layerMapのキー値を生成する
     * @param key 
     * @returns _layerMapのキー値
     */
    _convertMapKey(key: LayerKey | StaticLayerType) {
        const layerKey = typeof key !== 'object' ? this._convertLayerKeyFromStaticLayerType(key) : key;
        if (layerKey.layerType === LayerType.Track) {
            return `${layerKey.id}-${layerKey.layerType}=${layerKey.zoomLv.min}-${layerKey.zoomLv.max}`;
        } else {
            return `${layerKey.id}-${layerKey.layerType}`;
        }
    }

    createLayer(key: LayerKey | StaticLayerType) {
        let layerKey: LayerKey;
        if (typeof key !== 'object'){
            layerKey = this._convertLayerKeyFromStaticLayerType(key);
        } else {
            layerKey = key;
        }

        const mapKey = this._convertMapKey(layerKey);
        if (this._layerMap.has(mapKey)) {
            console.warn('already exist layer', key);
            return this._layerMap.get(mapKey)?.layer as VectorLayer<VectorSource>;
        }

        const source = new VectorSource();
        source.setProperties(layerKey);
        let layer: VectorLayer<VectorSource | Cluster>;
        if (layerKey.layerType === LayerType.Cluster) {
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
                    name: key,
                },
            })

            if (this._pointLayerStyle) {
                layer.setStyle(this._pointLayerStyle);
            }
        
        } else if (layerKey.layerType === LayerType.Track) {
            layer = new VectorLayer({
                source,
                minZoom: layerKey.zoomLv?.min,
                maxZoom: layerKey.zoomLv?.max,
                zIndex: 5,
                properties: {
                    name: key,
                },
            });
            if (this._trackLayerStyle) {
                layer.setStyle(this._trackLayerStyle);
            }

        } else {
            layer = new VectorLayer({
                source,
                properties: {
                    name: key,
                },
            });
    
            if (this._topographyLayerStyle) {
                layer.setStyle(this._topographyLayerStyle);
            }
        }
        this._layerMap.set(mapKey, Object.assign(layerKey, {
            layer,
        }));
        console.log('crateLayer', key, this._layerMap.size);
        return layer;
    }

    removeLayer(key: LayerKey | StaticLayerType) {
        const layer = this.getLayer(key);
        if (!layer) {
            console.warn('not exist remove target layer', key);
            return;
        }
        layer.dispose();
        const mapKey = this._convertMapKey(key);
        this._layerMap.delete(mapKey);
    }

    getLayer(id: LayerKey | StaticLayerType) {
        const mapKey = this._convertMapKey(id);
        return this._layerMap.get(mapKey)?.layer;
    }

    /**
     * 指定のデータソースIDに紐づくレイヤを返す。
     * @param dataSourceId 
     * @return レイヤ配列（Trackの場合は、複数存在しうるので）
     */
    getDataSourceLayers(dataSourceId: string): VectorLayer<VectorSource>[] {
        const list = [] as VectorLayer<VectorSource>[];
        this._layerMap.forEach(layerInfo => {
            if (layerInfo.id === dataSourceId) {
                list.push(layerInfo.layer);
            }
        });
        return list;
    }

    getSource(layerKey: LayerKey | StaticLayerType) {
        const mapKey = this._convertMapKey(layerKey);
        const source = this._layerMap.get(mapKey)?.layer.getSource();
        if (source instanceof Cluster) {
            return source.getSource();
        } else {
            return source;
        }
    }

    getTheStyleLayers(style: LayerType) {
        const list = [] as VectorLayer<VectorSource>[];
        this._layerMap.forEach((val) => {
            if (val.layerType === style) {
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
     * 指定のレイヤのLayerInfoを返す
     * @param layer 
     * @returns 
     */
    getLayerInfo(layer: Layer) {
        let info: LayerInfo | undefined;
        this._layerMap.forEach((val) => {
            if (val.layer === layer) {
                info = val;
            }
        });
        return info;
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

    /**
     * PointLayer(村マップの家、RealMapでの各ポイント)のスタイルを設定する
     * @param style 
     */
    setPointLayerStyle(style: StyleFunction) {
        this.getTheStyleLayers(LayerType.Cluster).forEach(layer => {
            layer.setStyle(style);
        });
        this._pointLayerStyle = style;
    }

    /**
     * TopographyLayer（村マップの地形, RealMapでのポイント以外）のスタイルを設定する
     * @param style 
     */
    setTopographyLayerStyle(style: StyleFunction) {
        this.getTheStyleLayers(LayerType.Normal).forEach(layer => {
            layer.setStyle(style);
        });
        this._topographyLayerStyle = style;
    }

    setTrackLayerStyle(style: StyleFunction) {
        this.getTheStyleLayers(LayerType.Track).forEach(layer => {
            layer.setStyle(style);
        });
        this._trackLayerStyle = style;
    }
    
    clear() {
        this._layerMap.forEach((val) => {
            val.layer.dispose();
        })
        this._layerMap.clear();
    }

    setClusterDistance(distance: number, minDistance: number) {
        this._layerMap.forEach((val) => {
            if (val.layerType !== LayerType.Cluster) {
                return;
            }
            const source = val.layer.getSource();
            if (source instanceof Cluster) {
                source.setDistance(distance);
                source.setMinDistance(minDistance);
            }
        });
    }

    length(): number {
        return this._layerMap.size;
    }
}
