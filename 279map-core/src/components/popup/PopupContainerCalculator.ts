import Feature from 'ol/Feature';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { LayerType } from "../TsunaguMap/VectorLayerMap";
import VectorSource from "ol/source/Vector";
import { OlMapType } from "../TsunaguMap/OlMapWrapper";
import { convertDataIdFromFeatureId, isEqualId } from "../../util/dataUtility";
import { getFeatureCenter } from "../../util/MapUtility";
import Style from "ol/style/Style";
import { Extent } from "ol/extent";
import { DataId } from '../../types-common/common-types';
import { ItemInfo } from '../../types/types';

type PopupGroup = {
    mainFeature: Feature;
    itemIds: DataId[];  // ポップアップに紐づくアイテムID一覧
    hasImage: boolean;
}

export type PopupGroupWithPosition = {
    itemPositions: GeolibInputCoordinates[];    // ポップアップ表示位置
    itemIds: DataId[];  // ポップアップに紐づくアイテムID一覧
}

/**
 * ポップアップ表示に関する以下を行うクラス
 * - ポップアップ表示対象を抽出してグルーピング
 * - ポップアップの表示位置を算出して付与
 */
export default class PopupContainerCalculator {
    _map: OlMapType;
    _extent: Extent;
    _hasContentsItemList: ItemInfo[] = [];

    constructor(map: OlMapType, extent: Extent) {
        this._map = map;
        this._extent = extent;
    }

    setHasContentsItemIdList(list: ItemInfo[]) {
        this._hasContentsItemList = list;
    }

    /**
     * 地図に表示するポップアップ情報を算出して返す
     */
    async calculatePopupGroup(): Promise<PopupGroupWithPosition[]> {
        // ポップアップ表示対象を抽出してグルーピングする
        const popupGroups = this._makePopupGroups();
        // ポップアップの表示位置を算出して付与する
        const popupGroupsWithPosition = await this._calculatePopupPosition(popupGroups);

        return popupGroupsWithPosition;
    }

    /**
     * ポップアップ表示するグループ情報を生成して返す
     * @returns 
     */
    _makePopupGroups(): PopupGroup[] {
        const itemPopupInfos = this._makeItemPopupGroups();
        const areaPopupInfos = this._makeAreaPopupGroups();
        let infos = itemPopupInfos.concat(areaPopupInfos);
        return infos;
    }

    /**
     * 建物orピンのポップアップ情報を生成して返す
     */
    _makeItemPopupGroups(): PopupGroup[] {
        const itemSources = this._map.getLayersOfTheType(LayerType.Point).map(layerInfo => {
            return layerInfo.layer.getSource() as VectorSource;
        });
        if (itemSources.length === 0) return [];
    
        const popupInfoList = [] as PopupGroup[];
        itemSources.forEach(itemSource => {
            // 現在の表示範囲内のアイテムに絞る
            itemSource.getFeaturesInExtent(this._extent).forEach(feature => {
                const features = feature.get('features') as Feature[];
    
                // コンテンツを持つアイテムに絞る
                const itemIds = features.map((f): DataId => {
                    const id = convertDataIdFromFeatureId(f.getId() as string);
                    return id;
                }).filter(id => {
                    return this._hasContentsItemList.some(item => isEqualId(item.id, id));
                });
                if (itemIds.length === 0) {
                    return;
                }

                const hasImage = itemIds.some(itemId => {
                    const target = this._hasContentsItemList.find(item => isEqualId(itemId, item.id));
                    return (target?.hasImageContentId ?? []).length > 0;
                });
    
                popupInfoList.push({
                    mainFeature: features[0],
                    itemIds,
                    hasImage,
                })
            });
        });
    
        return popupInfoList;
    }

    /**
     * エリアのポップアップ情報を生成して返す
     */
    _makeAreaPopupGroups(): PopupGroup[] {
        const areaSources = this._map.getLayersOfTheType(LayerType.Topography).map(layerInfo => layerInfo.layer.getSource() as VectorSource);
        if (areaSources.length === 0) return [];
        const popupInfoList = [] as PopupGroup[]; 
        areaSources.forEach(source => {
            // 現在の表示範囲内のアイテムに絞る
            source.getFeaturesInExtent(this._extent).forEach(feature => {

                // コンテンツを持つアイテムに絞る
                const id = convertDataIdFromFeatureId(feature.getId() as string);
                if (!this._hasContentsItemList.some(item => isEqualId(item.id, id))) {
                    return;
                }

                const item = this._hasContentsItemList.find(item => isEqualId(id, item.id));
                const hasImage = (item?.hasImageContentId ?? []).length > 0;

                popupInfoList.push({
                    mainFeature: feature,
                    itemIds: [id],
                    hasImage,
                })
            });
        })

        return popupInfoList;
    }

    /**
     * ポップアップの表示位置
     * @param popupGroups 
     */
    _calculatePopupPosition(popupGroups: PopupGroup[]): Promise<PopupGroupWithPosition[]> {
        return new Promise<PopupGroupWithPosition[]>((resolve) => {

            // PopupGroupに位置情報を割り当てる
            const calcPositionFunc = (myPopupGroups: PopupGroup[]): {result: PopupGroupWithPosition[], failed: PopupGroup[]} => {
                const result = [] as PopupGroupWithPosition[];
                const failedList = [] as PopupGroup[];
                for (const popupGroup of myPopupGroups) {
                    const itemPosition = this._getPopupPosition(popupGroup.mainFeature);
                    if (!itemPosition) {
                        failedList.push(popupGroup);
                        continue;
                    }
                    result.push({
                        itemPositions: [itemPosition],
                        itemIds: popupGroup.itemIds,
                    });
                }
                return {
                    result,
                    failed: failedList,
                }
            }
            const list = [] as PopupGroupWithPosition[];
            let tryCnt = 0;
            const func = (myPopupGroups: PopupGroup[]) => {
                tryCnt++;
                const result = calcPositionFunc(myPopupGroups);
                Array.prototype.push.apply(list, result.result);
                if (result.failed.length === 0 || tryCnt > 3) {
                    if (result.failed.length > 0) {
                        console.warn('popup position can not calculate.', result.failed);
                    }
                    resolve(list);
                } else {
                    // 位置情報取得に失敗したものについて、時間を置いて再実行する
                    setTimeout(() => {
                        func(result.failed);
                    }, 100);
                }
            }
            func(popupGroups);
        });
    }

    _getPopupPosition(feature: Feature): undefined | { longitude: number; latitude: number; } {
        // -- 中心位置取得
        const itemPosition = getFeatureCenter(feature);
        if (!itemPosition) {
            console.log('getFeatureCenter undefined')
            return;
        }

        const pointStyleFunction = this._map._vectorLayerMap._pointLayerStyle;
        if (!pointStyleFunction) {
            console.warn('pointStyleFunction undefined');
            return;
        }

        if (feature.getGeometry()?.getType() === 'Point') {
            // 建物orピンの場合、アイコンの上部にポップアップを表示する
            const style = pointStyleFunction(feature, this._map.currentResolution) as Style;
            const image = style.getImage();
            const pixel = this._map.getPixelFromCoordinate([itemPosition.longitude, itemPosition.latitude]);
            const imageSize = image?.getSize();
            if (!imageSize || imageSize.length < 2 || !pixel || pixel.length < 2) {
                // console.warn('imageSize undefined', feature.getId());
                return;
            }

            pixel[1] = pixel[1] - imageSize[1] * (image.getScale() as number);
            const newPosition = this._map.getCoordinateFromPixel(pixel);
            itemPosition.latitude = newPosition[1];

        }

        return itemPosition;    
    };

}
