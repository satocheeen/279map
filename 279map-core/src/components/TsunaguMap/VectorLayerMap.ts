import { Cluster, Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { StyleFunction } from "ol/style/Style";
import Layer from "ol/layer/Layer";
import { getMapKey } from "../../util/dataUtility";
import { DataId } from "../../types-common/common-types";

export enum LayerType {
    Point = 'Point',    // Pointa用レイヤ。（Cluster設定されている）
    Topography = 'Topography',  // 地形、AREA用レイヤ。
    Track = 'Track',         // Track（軌跡）用レイヤ
}

export type LayerDefine = {
    dataSourceId: string;
    // group: string;
    editable: boolean;
} & (
    {
        layerType: LayerType.Point | LayerType.Topography;
    } | {
        layerType: LayerType.Track;
        zoomLv: {
            min: number;
            max: number;
        }
    }
)
export type LayerInfo = LayerDefine & {
    layer: VectorLayer<VectorSource>;
}

/**
 * VectorレイヤとVectorソースを一元管理するクラス
 * (一時レイヤは管理外)
 */
export class VectorLayerMap {
    _layerMap: Map<string, LayerInfo>;
    _pointLayerStyle?: StyleFunction;
    _topographyLayerStyle?: StyleFunction;
    _trackLayerStyle?: StyleFunction;

    constructor() {
        this._layerMap = new Map<string, LayerInfo>();
    }

    /**
     * _layerMapのキー値を生成する
     * @param layerDefine 
     * @returns _layerMapのキー値
     */
    _convertMapKey(layerDefine: LayerDefine) {
        const json = JSON.parse(JSON.stringify(layerDefine));
        if ('editable' in json) {
            delete json.editable;
        }        
        return JSON.stringify(json);
    }

    createLayer(layerDefine: LayerDefine): VectorLayer<VectorSource> | undefined {
        const mapKey = this._convertMapKey(layerDefine);
        if (this._layerMap.has(mapKey)) {
            console.warn('already exist layer', layerDefine);
            return;
        }

        const source = new VectorSource();
        source.setProperties(layerDefine);
        let layer: VectorLayer<VectorSource | Cluster>;
        if (layerDefine.layerType === LayerType.Point) {
            const clusterSource = new Cluster({
                distance: 80,
                minDistance: 20,
                source,
            });
            layer = new VectorLayer({
                source: clusterSource,
                zIndex: 10,
                renderBuffer: 200,
            })

            if (this._pointLayerStyle) {
                layer.setStyle(this._pointLayerStyle);
            }
        
        } else if (layerDefine.layerType === LayerType.Track) {
            layer = new VectorLayer({
                source,
                minZoom: layerDefine.zoomLv?.min,
                maxZoom: layerDefine.zoomLv?.max,
                zIndex: 5,
            });
            if (this._trackLayerStyle) {
                layer.setStyle(this._trackLayerStyle);
            }

        } else {
            layer = new VectorLayer({
                source,
            });
    
            if (this._topographyLayerStyle) {
                layer.setStyle(this._topographyLayerStyle);
            }
        }
        layer.setProperties(layerDefine);
        this._layerMap.set(mapKey, Object.assign(layerDefine, {
            layer,
        }));
        return layer;
    }

    getLayer(layerDefine: LayerDefine) {
        const mapKey = this._convertMapKey(layerDefine);
        return this._layerMap.get(mapKey)?.layer;
    }

    removeLayer(layerDefine: LayerDefine) {
        const layer = this.getLayer(layerDefine);
        if (!layer) {
            console.warn('not exist remove target layer', layerDefine);
            return;
        }
        layer.dispose();
        const mapKey = this._convertMapKey(layerDefine);
        this._layerMap.delete(mapKey);
    }

    /**
     * 指定のデータソースIDのLayerInfoを返す
     * @param dataSourceId 
     * @return レイヤInfo配列（1データソースが、Pointレイヤ、Topographyレイヤがあったり、Trackの場合は、ズームLvごとのレイヤがあるので、n個）
     */
    getLayerInfoOfTheDataSource(dataSourceId: string) {
        const list = [] as LayerInfo[];
        this._layerMap.forEach(layerInfo => {
            if (layerInfo.dataSourceId === dataSourceId) {
                list.push(layerInfo);
            }
        });
        return list;
    }

    getAllLayerInfo() {
        const list = [] as LayerInfo[];
        this._layerMap.forEach(layerInfo => {
            list.push(layerInfo);
        });
        return list;
    }

    // /**
    //  * 指定のグループに属するLayerInfoを返す
    //  * @param dataSourceId 
    //  * @return レイヤInfo配列
    //  */
    // getLayerInfoOfTheGroup(group: string) {
    //     const list = [] as LayerInfo[];
    //     this._layerMap.forEach(layerInfo => {
    //         if (layerInfo.group === group) {
    //             list.push(layerInfo);
    //         }
    //     });
    //     return list;
    // }

    /**
     * 指定のデータソースIDのLayerTypeを返す
     * @param dataSourceId 
     * @return レイヤ種別配列（1データソースが、Pointレイヤ、Topographyレイヤがあったり、Trackの場合は、ズームLvごとのレイヤがあるので、n個）
     */
    getLayerTypeOfTheDataSource(dataSourceId: string): LayerType[] {
        const list = [] as LayerType[];
        this._layerMap.forEach(layerInfo => {
            if (layerInfo.dataSourceId === dataSourceId) {
                list.push(layerInfo.layerType);
            }
        });
        return list;
    }

    /**
     * 指定のデータソースIDに紐づくレイヤを返す。
     * @param dataSourceId 
     * @return レイヤ配列（1データソースが、Pointレイヤ、Topographyレイヤがあったり、Trackの場合は、ズームLvごとのレイヤがあるので、n個）
     */
    getDataSourceLayers(dataSourceId: string): VectorLayer<VectorSource>[] {
        const list = [] as VectorLayer<VectorSource>[];
        this._layerMap.forEach(layerInfo => {
            if (layerInfo.dataSourceId === dataSourceId) {
                list.push(layerInfo.layer);
            }
        });
        return list;
    }

    getSource(layerDefine: LayerDefine) {
        const mapKey = this._convertMapKey(layerDefine);
        const source = this._layerMap.get(mapKey)?.layer.getSource();
        if (source instanceof Cluster) {
            return source.getSource();
        } else {
            return source;
        }
    }

    /**
     * 指定の種別のレイヤを返す。（一時レイヤは返さない）
     * @param layerType レイヤ種別
     * @returns 指定種別のレイヤ情報一覧
     */
    getLayersOfTheType(layerType: LayerType): LayerInfo[] {
        const list = [] as LayerInfo[];
        this._layerMap.forEach((val) => {
            if (val.layerType === layerType) {
                list.push(val);
            }
        })
        return list;
    }

    /**
     * 指定のfeatureを含んでいるレイヤ情報を返す
     * @param feature 
     */
    getLayerInfoContainedTheFeature(feature: Feature<Geometry>): LayerInfo | undefined {
        let hit: LayerInfo | undefined;
        this._layerMap.forEach((val) => {
            const source = val.layer.getSource();
            if (source?.hasFeature(feature)) {
                hit = val;
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
    getFeatureById(id: DataId) {
        const idStr = getMapKey(id);
        let hit: Feature<Geometry> | undefined;
        this._layerMap.forEach((layer) => {
            let source = layer.layer.getSource();
            if (layer.layerType === LayerType.Point) {
                source = (source as Cluster).getSource();
            }
            if (!source) return;
            const feature = source.getFeatureById(idStr);
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
        this.getLayersOfTheType(LayerType.Point).forEach(layerInfo => {
            layerInfo.layer.setStyle(style);
        });
        this._pointLayerStyle = style;
    }

    /**
     * TopographyLayer（村マップの地形, RealMapでのポイント以外）のスタイルを設定する
     * @param style 
     */
    setTopographyLayerStyle(style: StyleFunction) {
        this.getLayersOfTheType(LayerType.Topography).forEach(layerInfo => {
            layerInfo.layer.setStyle(style);
        });
        this._topographyLayerStyle = style;
    }

    setTrackLayerStyle(style: StyleFunction) {
        this.getLayersOfTheType(LayerType.Track).forEach(layerInfo => {
            layerInfo.layer.setStyle(style);
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
            if (val.layerType !== LayerType.Point) {
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
