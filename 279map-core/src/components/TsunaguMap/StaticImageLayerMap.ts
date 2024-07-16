import ImageLayer from "ol/layer/Image";
import { FeatureType, ItemInfo } from "../../entry";
import Static from "ol/source/ImageStatic";
import { bbox } from '@turf/turf';
import { OlMapWrapper } from "./OlMapWrapper";

type StaticImageLayerDefine = {
    datasourceId: string;
    editable: boolean;
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

    createLayer(define: StaticImageLayerDefine) {
        this._layerDefineMap.set(define.datasourceId, define);
    }

    has(datasourceId: string) {
        return this._layerDefineMap.has(datasourceId);
    }

    addFeature(item: ItemInfo) {
        if (item.geoProperties.featureType !== FeatureType.STATIC_IMAGE) {
            console.warn('this is not static image', item);
            return;
        }
        const layer = new ImageLayer({
            source: new Static({
                url: item.geoProperties.url,
                imageExtent: bbox(item.geometry), //[137.26410894541078, 37.524180174316056, 137.27424047156507, 37.533808716528185],
                projection: 'EPSG: 4326',
            }),
            opacity: item.geoProperties.opacity ?? 1,
            zIndex: 1,
        });
        this._map._map.addLayer(layer);
    }
}