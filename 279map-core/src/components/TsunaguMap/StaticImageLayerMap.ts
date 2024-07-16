import ImageLayer from "ol/layer/Image";
import { FeatureType, ItemInfo } from "../../entry";
import Static from "ol/source/ImageStatic";
import { bbox } from '@turf/turf';
import { OlMapWrapper } from "./OlMapWrapper";

type StaticImageLayerDefine = {
    datasourceId: string;
    editable: boolean;
    layers: ImageLayer<Static>[];
}
/**
 * StaticImageレイヤを一元管理するクラス
 */
export class StaticImageLayerMap {
    _map: OlMapWrapper;
    _layerDefineMap = new Map<string, StaticImageLayerDefine>();

    constructor(map: OlMapWrapper) {
        this._map = map;
    }

    createLayer(define: Omit<StaticImageLayerDefine, 'layers'>) {
        this._layerDefineMap.set(define.datasourceId, Object.assign({}, define, { layers: []}));
    }

    has(datasourceId: string) {
        return this._layerDefineMap.has(datasourceId);
    }

    addFeature(item: ItemInfo) {
        if (item.geoProperties.featureType !== FeatureType.STATIC_IMAGE) {
            console.warn('this is not static image', item);
            return;
        }
        const info = this._layerDefineMap.get(item.datasourceId);
        if (!info) {
            console.warn('layer info not exist', item);
            return;
        }
        const layer = new ImageLayer({
            source: new Static({
                url: 'url' in item.geoProperties ? item.geoProperties.url : 'data:image/' + item.geoProperties.base64,
                imageExtent: bbox(item.geometry),
                projection: 'EPSG: 4326',
            }),
            opacity: item.geoProperties.opacity ?? 1,
            zIndex: 1,
        });
        this._map._map.addLayer(layer);
        info.layers.push(layer);
    }

    getLayerOfTheDataSource(datasourceId: string) {
        return this._layerDefineMap.get(datasourceId)?.layers ?? [];
    }
}