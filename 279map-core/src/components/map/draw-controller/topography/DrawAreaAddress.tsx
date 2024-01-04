import { GeoJsonObject } from "geojson";
import React, { useEffect, useRef, useCallback, useState } from "react"
import SearchAddress from "../../../common/SearchAddress";
import PromptMessageBox from "../PromptMessageBox";
import GeoJSON from 'ol/format/GeoJSON';
import useTopographyStyle from "../../useTopographyStyle";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { useMap } from "../../useMap";
import { GeocoderTarget } from "../../../../graphql/generated/graphql";
import { FeatureType } from "../../../../types-common/common-types";

type Props = {
    onCancel?: () => void;
    onOk?: (feature: Feature<Geometry>) => void;
}
enum Stage {
    SearchAddress,
    Confirm,
}

/**
 * 住所検索からエリア図形を取得して返す
 * @param props 
 * @returns 
 */
export function DrawAreaAddress(props: Props) {
    const { map } = useMap();
    const [stage, setStage] = useState(Stage.SearchAddress);
    const styleHook = useTopographyStyle({
        defaultFeatureType: FeatureType.AREA,
        drawing: true,
    });
    const drawingSource = useRef<VectorSource|null>(null);

    // 初期化
    useEffect(() => {
        if (!map) return;
        const drawingLayer = map.createDrawingLayer(styleHook.getStyleFunction());
        drawingSource.current = drawingLayer.getSource();

        return () => {
            map.removeDrawingLayer(drawingLayer);
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
        drawingSource.current?.clear();
        drawingSource.current?.addFeature(feature);
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            map?.fit(extent);
        setStage(Stage.Confirm);
    }, [map]);

    const onConfirmAddressCancel = useCallback(() => {
        // 書きかけ削除
        drawingSource.current?.clear();
        setStage(Stage.SearchAddress);
    }, []);

    const onOk = useCallback(() => {
        if (!props.onOk)
            return;
        
        const feature = drawingSource.current?.getFeatures()[0];
        if (!feature) return;

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
                                searchTarget={[GeocoderTarget.Area]}
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