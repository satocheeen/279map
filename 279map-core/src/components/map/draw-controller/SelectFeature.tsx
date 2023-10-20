import { Feature, MapBrowserEvent } from 'ol';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptMessageBox from './PromptMessageBox';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import { FeatureLike } from 'ol/Feature';
import useTopographyStyle from '../useTopographyStyle';
import usePointStyle from '../usePointStyle';
import { MapKind } from '279map-common';
import { LayerInfo, LayerType } from '../../TsunaguMap/VectorLayerMap';
import { containFeatureInLayer } from '../../../util/MapUtility';
import { useMap } from '../useMap';
import { currentMapKindAtom } from '../../../store/session';
import { useAtom } from 'jotai';
import { convertDataIdFromFeatureId } from '../../../util/dataUtility';
import { useItems } from '../../../store/item/useItems';
import { topographySelectStyleFunction } from './utility';

type Props = {
    targetType: LayerType;
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
        const layers = map.getLayersOfTheType(props.targetType);
        // 編集可能なレイヤに絞って返す
        return layers.filter(l => l.editable);
    }, [props.targetType, map]);

    // 初期化
    useEffect(() => {
        if (!map) return;
        const styleFunction = function(){
            if (props.targetType === LayerType.Topography) {
                return  topographyStyleHook.getStyleFunction(topographySelectStyleFunction);
            } else {
                return selectedStyleFunction;
            }
        }();
        select.current = new Select({
            condition: click,
            layers: targetLayers.map(l => l.layer),
            style: styleFunction,
            filter: (feature) => {
                if (props.targetType !== LayerType.Point) {
                    return true;
                }
                const features = feature.get('features') as FeatureLike[];
                // 複数重なっているものは選択不可
                return features.length === 1;
            },
        });
        select.current.on('select', (evt: SelectEvent) => {
            if (evt.selected.length === 0) {
                setSelectedFeature(undefined);
                return;
            }
            if (props.targetType === LayerType.Point) {
                const features = evt.selected[0].get('features') as Feature[];
                setSelectedFeature(features[0]);
            } else{
                setSelectedFeature(evt.selected[0]);
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
        let name: string;
        if (props.targetType === LayerType.Point) {
            if (mapKind === MapKind.Real) {
                name = '地点';
            } else {
                name = '建物';
            }
        } else {
            if (mapKind === MapKind.Real) {
                name = 'エリア';
            } else {
                name = '地形';
            }
        }
        const message = props.message ? props.message : `対象の${name}を選択して、OKボタンを押下してください。`;
        return message + (errorMessage ? '\n' + errorMessage : '');
    }, [props.message, props.targetType, mapKind, errorMessage]);

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