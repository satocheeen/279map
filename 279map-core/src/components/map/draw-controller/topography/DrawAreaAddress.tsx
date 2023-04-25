import { GeoJsonObject } from "geojson";
import { Feature, Map } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import React, { useCallback, useEffect, useState } from "react"
import SearchAddress from "../../../common/SearchAddress";
import useTopographyStyle from "../../useTopographyStyle";
import PromptMessageBox from "../PromptMessageBox";
import GeoJSON from 'ol/format/GeoJSON';
import { FeatureType } from "../../../../279map-common";

type Props = {
    map: Map;
    onCancel?: () => void;
    onOk?: (feature: Feature) => void;
}
enum Stage {
    SearchAddress,
    Confirm,
}
const drawingSource = new VectorSource();

/**
 * 住所検索からエリア図形を取得して返す
 * @param props 
 * @returns 
 */
export function DrawAreaAddress(props: Props) {
    const [stage, setStage] = useState(Stage.SearchAddress);
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.AREA,
    });

    /**
     * 初期化
     */
    useEffect(() => {
        const drawingLayer = new VectorLayer({
            source: drawingSource,
            style: styleHook.getStyleFunction(),
            zIndex: 10,
        });
        props.map.addLayer(drawingLayer);

        return () => {
            drawingSource.clear();
            props.map.removeLayer(drawingLayer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSelectAdressCanceled = useCallback(() => {
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props]);

    const onSelectAddress = useCallback((geoJson: GeoJsonObject) => {
        const feature = new GeoJSON().readFeatures(geoJson)[0];
        feature.setProperties({
            featureType: FeatureType.AREA,
        });
        drawingSource.clear();
        drawingSource.addFeature(feature);
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            props.map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
            });
        setStage(Stage.Confirm);
    }, [props.map]);

    const onConfirmAddressCancel = useCallback(() => {
        setStage(Stage.SearchAddress);
    }, []);

    const onOk = useCallback(() => {
        if (!props.onOk)
            return;
        
        const feature = drawingSource.getFeatures()[0];
        if (!feature) {
            console.warn('no feature');
            return;
        }
        props.onOk(feature);
    }, [props]);

    switch(stage) {
        case Stage.SearchAddress:
            return (
                <PromptMessageBox message='住所検索してください.'
                    cancelname='戻る'
                    cancel={onSelectAdressCanceled}>
                        <div>
                            <SearchAddress
                                searchTarget={['area']}
                                onAddress={onSelectAddress} />
                        </div>
                </PromptMessageBox>
            );
        case Stage.Confirm:
            return (
                <PromptMessageBox message='この場所でよろしいですか'
                    cancelname='戻る'
                    ok={onOk}
                    cancel={onConfirmAddressCancel} />
            )
    }
}