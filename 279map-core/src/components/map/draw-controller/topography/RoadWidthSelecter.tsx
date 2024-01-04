import React, { useRef, useCallback, useEffect, useState } from 'react';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import useTopographyStyle, { RoadWidth } from '../../useTopographyStyle';
import { convertLineToPolygon, extractGeoProperty } from '../../../../util/MapUtility';
import PromptMessageBox from '../PromptMessageBox';
import { Geometry } from 'ol/geom';
import { useMap } from '../../useMap';
import { FeatureType } from '../../../../types-common/common-types';

type Props = {
    targetRoad: Feature;
    width?: RoadWidth;  // 初期値
    onOk: (feature: Feature<Geometry>) => void;   // feature = 元のlineGeoJsonをプロパティに格納したポリゴン。
    onCancel: () => void;
}

/**
 * 道幅選択部品
 */
export default function RoadWidthSelecter(props: Props) {
    const { map } = useMap();
    const [width, setWidth] = useState(props.width === undefined ? RoadWidth.M : props.width);
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.ROAD,
    });
    const widthSimulateSource = useRef<VectorSource|null>(null);

    useEffect(() => {
        if (!map) return;
        const widthSimulateLayer = map.createDrawingLayer(styleHook.getStyleFunction());
        widthSimulateSource.current = widthSimulateLayer.getSource();

        // 初期値幅の設定
        const properties = extractGeoProperty(props.targetRoad.getProperties());
        if (properties.featureType === FeatureType.ROAD && properties.width) {
            const rw = RoadWidth.getValueOfKey(properties.width);
            setWidth(rw);
        }

        return () => {
            map.removeDrawingLayer(widthSimulateLayer);
        };
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map]);

    useEffect(() => {
        // 新たな道幅で描画
        const tempFeature = props.targetRoad.clone();
        console.log('targetRoad', props.targetRoad.getProperties());
        tempFeature.setProperties({'featureType': FeatureType.ROAD});
        tempFeature.setProperties({'width': width.key});
        console.log('tempFeature', tempFeature);
        convertLineToPolygon(tempFeature, width.distance);
        widthSimulateSource.current?.clear();
        widthSimulateSource.current?.addFeature(tempFeature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width]);

    // 道幅変更
    const onSelectWidthChanged = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const newWidth = RoadWidth.getValueOfKey(evt.target.value);
        console.log('newWidth', newWidth);
        setWidth(newWidth);
    }

    const onOk = useCallback(() => {
        if (!widthSimulateSource.current) {
            console.warn('想定外エラー widthSimulateSource not find');
            return;
        }
        props.onOk(widthSimulateSource.current.getFeatures()[0]);
    }, [props]);

    const message = '道幅を選択してください.';
    return (
        <PromptMessageBox message={message} okname="完了" ok={onOk} cancel={props.onCancel}>
            <select value={width.key} className="form-control" onChange={onSelectWidthChanged}>
                {
                    RoadWidth.values().map(item => {
                        return (
                            <option value={item.key} key={item.key}>{item.name}</option>
                        );
                    })
                }
            </select>
       </PromptMessageBox>
    );

}