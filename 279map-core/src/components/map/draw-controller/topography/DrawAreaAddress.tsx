import { GeoJsonObject } from "geojson";
import React, { useCallback, useEffect, useState, useContext } from "react"
import SearchAddress from "../../../common/SearchAddress";
import PromptMessageBox from "../PromptMessageBox";
import GeoJSON from 'ol/format/GeoJSON';
import { FeatureType } from "../../../../279map-common";
import { MapChartContext } from "../../../TsunaguMap/MapChart";

type Props = {
    onCancel?: () => void;
    onOk?: () => void;
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
    const { map } = useContext(MapChartContext);
    const [stage, setStage] = useState(Stage.SearchAddress);

    /**
     * 初期化
     */
    useEffect(() => {
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
        const drawingSource = map.getDrawingLayer().getSource();
        if (!drawingSource) {
            console.warn('想定外 drawingSource not found.');
            return;
        }
        drawingSource.clear();
        drawingSource.addFeature(feature);
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            map.fit(extent, {
                padding: [50, 50, 50, 50],
            });
        setStage(Stage.Confirm);
    }, [map]);

    const onConfirmAddressCancel = useCallback(() => {
        // 書きかけ削除
        map.getDrawingLayer().getSource()?.clear();
        setStage(Stage.SearchAddress);
    }, [map]);

    const onOk = useCallback(() => {
        if (props.onOk) {
            props.onOk();
        }
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