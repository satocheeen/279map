import React, { useCallback, useEffect, useState } from 'react';
import Feature from 'ol/Feature';
import { Map } from 'ol';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import useTopographyStyle, { RoadWidth } from '../../useTopographyStyle';
import { convertLineToPolygon, extractGeoProperty } from '../../../../util/MapUtility';
import PromptMessageBox from '../PromptMessageBox';
import { FeatureType } from '279map-common/dist/types';

type Props = {
    map: Map;
    targetRoad: Feature;
    width?: RoadWidth;  // 初期値
    onOk: (feature: Feature) => void;   // feature = 元のlineGeoJsonをプロパティに格納したポリゴン。
    onCancel: () => void;
}

const widthSimulateSource = new VectorSource();

/**
 * 道幅選択部品
 */
export default function RoadWidthSelecter(props: Props) {
    const [width, setWidth] = useState(props.width === undefined ? RoadWidth.M : props.width);
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.ROAD,
    });

    useEffect(() => {
        const widthSimulateLayer: VectorLayer<VectorSource> = new VectorLayer({
            source: widthSimulateSource,
            style: styleHook.getStyleFunction(),
            zIndex: 10,
        });
    
        props.map.addLayer(widthSimulateLayer);

        // 初期値幅の設定
        const properties = extractGeoProperty(props.targetRoad.getProperties());
        if (properties.featureType === FeatureType.ROAD && properties.width) {
            const rw = RoadWidth.getValueOfKey(properties.width);
            setWidth(rw);
        }

        return () => {
            props.map.removeLayer(widthSimulateLayer);
        };
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

    useEffect(() => {
        // 新たな道幅で描画
        const tempFeature = props.targetRoad.clone();
        console.log('targetRoad', props.targetRoad.getProperties());
        tempFeature.setProperties({'featureType': FeatureType.ROAD});
        tempFeature.setProperties({'width': width.key});
        console.log('tempFeature', tempFeature);
        convertLineToPolygon(tempFeature, width.distance);
        widthSimulateSource.clear();
        widthSimulateSource.addFeature(tempFeature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width]);

    // 道幅変更
    const onSelectWidthChanged = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const newWidth = RoadWidth.getValueOfKey(evt.target.value);
        console.log('newWidth', newWidth);
        setWidth(newWidth);
    }

    const onOk = useCallback(() => {
        props.onOk(widthSimulateSource.getFeatures()[0]);
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