import { Feature, MapBrowserEvent } from 'ol';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptMessageBox from '../PromptMessageBox';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { never } from 'ol/events/condition'
import { click } from 'ol/events/condition';
import { FeatureLike } from 'ol/Feature';
import useTopographyStyle from '../../useTopographyStyle';
import usePointStyle from '../../usePointStyle';
import { LayerInfo, LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { containFeatureInLayer } from '../../../../util/MapUtility';
import { useMap } from '../../useMap';
import { currentMapKindAtom } from '../../../../store/session';
import { useAtom } from 'jotai';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { useItems } from '../../../../store/item/useItems';
import { topographySelectStyleFunction } from '../utility';
import { MapKind, FeatureType, GeoProperties } from "../../../../types-common/common-types";
import { Style } from 'ol/style';

type Props = {
    featureType?: FeatureType[];
    // targetType: LayerType;
    message?: string;
    onOk: (feature: Feature) => void;
    onCancel: () => void;
}

/**
 * 編集対象のFeatureを選択させるコンポーネント
 * @param props 
 * @returns 
 */
export default function SelectFeature(props: Props) {
    const select = useRef<Select>();
    const [selectedFeature, setSelectedFeature] = useState<Feature>();
    const topographyStyleHook = useTopographyStyle({});
    const { map } = useMap();
    const { selectedStyleFunction } = usePointStyle();
    const [ mapKind ] = useAtom(currentMapKindAtom);

    const targetLayers = useMemo((): LayerInfo[] => {
        if (!map) return [];
        const targetLayers = props.featureType ? props.featureType.reduce((acc, cur) => {
            const layerType = function() {
                switch(cur) {
                    case FeatureType.AREA:
                    case FeatureType.EARTH:
                    case FeatureType.FOREST:
                    case FeatureType.ROAD:
                        return LayerType.Topography;
                    case FeatureType.STRUCTURE:
                        return LayerType.Point;
                    case FeatureType.TRACK:
                        return LayerType.Track;
                }
            }();
            if (!acc.includes(layerType)) {
                return [...acc, layerType];
            } else {
                return acc;
            }
        }, [] as LayerType[]) ?? []
        : [LayerType.Point, LayerType.Topography, LayerType.Track];
        const layers = targetLayers.reduce((acc, cur) => {
            const mylayers = map.getLayersOfTheType(cur);
            return [...acc, ...mylayers];
        }, [] as LayerInfo[]);

        // 編集可能なレイヤに絞って返す
        return layers.filter(l => l.editable);
    }, [props.featureType, map]);

    // 初期化
    useEffect(() => {
        if (!map) return;
        select.current = new Select({
            condition: click,
            toggleCondition: never,     // Shiftを押しながらの複数選択禁止
            layers: targetLayers.map(l => l.layer),
            style: (feature: FeatureLike, resolution: number): Style | Style[] => {
                if (feature.get('features')) {
                    // Cluster(Point)の場合
                    return selectedStyleFunction(feature, resolution);

                } else {
                    // TODO: 軌跡は別スタイルにする
                    return  topographyStyleHook.getStyleFunction(topographySelectStyleFunction)(feature, resolution);

                }
            },
            filter: (feature) => {
                if (!props.featureType) return true;
                if (feature.get('features')) {
                    // Cluster(Point)の場合
                    if (!props.featureType.includes(FeatureType.STRUCTURE)) {
                        return false;
                    }
                    const features = feature.get('features') as FeatureLike[];
                    // 複数重なっているものは選択不可 TODO: 重畳選択を表示して選択させるようにする
                    return features.length === 1;

                } else {
                    // その他
                    const featureType = (feature.getProperties() as GeoProperties).featureType;
                    return props.featureType.includes(featureType);
                }
            },
        });
        select.current.on('select', (evt: SelectEvent) => {
            if (evt.selected.length === 0) {
                setSelectedFeature(undefined);
                return;
            }
            const feature = evt.selected[0];
            if (feature.get('features')) {
                // Cluster(Point)の場合
                const features = feature.get('features') as Feature[];
                setSelectedFeature(features[0]);
            } else {
                setSelectedFeature(feature);
            }
        });
        map.addInteraction(select.current);

        // 選択可能な地図上アイテムhover時にポインター表示
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            const targets = map.getNearlyFeatures(evt.pixel);
            const isHover = targets.some(target => {
                return targetLayers.some(layerInfo => {
                    return containFeatureInLayer(target.feature, layerInfo.layer);
                });
            });
            if (isHover) {
                map.setCursorStyle('pointer');
            } else {
                map.setCursorStyle('');
            }
        };
        map.on('pointermove', pointerMoveEvent);


        return () => {
            if (select.current) {
                map.removeInteraction(select.current);
            }
            map.un('pointermove', pointerMoveEvent);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();
    const message= useMemo(() => {
        const name = !props.featureType ? 'アイテム' : props.featureType.map(ft => {
            switch(ft) {
                case FeatureType.AREA:
                    return 'エリア';
                case FeatureType.EARTH:
                    return '土地';
                case FeatureType.FOREST:
                    return '緑地';
                case FeatureType.ROAD:
                    return '道';
                case FeatureType.STRUCTURE:
                    return mapKind === MapKind.Real ? '地点' : '建物';
                case FeatureType.TRACK:
                    return '軌跡';
            }
        }).join(',');
        const message = props.message ? props.message : `対象の${name}を選択して、OKボタンを押下してください。`;
        return message + (errorMessage ? '\n' + errorMessage : '');
    }, [props.message, props.featureType, mapKind, errorMessage]);

    const { getItem } = useItems();

    const onOkClicked = useCallback(async() => {
        setErrorMessage(undefined);
        if (!selectedFeature) {
            console.warn('選択アイテムなし');
            return;
        }
        const idStr = selectedFeature.getId() as string;
        const id = convertDataIdFromFeatureId(idStr);
        const item = getItem(id);
        if (item.temporary) {
            setErrorMessage('現在登録処理中のアイテムのため編集できません。少し待ってから選択してください。');
            return;
        }

        props.onOk(selectedFeature);
    }, [props, selectedFeature, getItem]);

    const onCancel = useCallback(() => {
        props.onCancel();
    }, [props]);

    return (
        <PromptMessageBox
            message={message}
            ok={onOkClicked} cancel={onCancel}
            okdisabled={selectedFeature === undefined} />
    );
}