import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Feature } from 'ol';
import SelectStructureDialog from './SelectStructureDialog';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import VectorSource from 'ol/source/Vector';
import { createGeoJson } from '../../../../util/MapUtility';
import usePointStyle from '../../usePointStyle';
import PromptMessageBox from '../PromptMessageBox';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import SearchAddress, { SearchAddressHandler } from '../../../common/SearchAddress';
import GeoJSON from 'ol/format/GeoJSON';
import { GeoJsonObject } from 'geojson';
import { SystemIconDefine } from '../../../../types/types';
import VectorLayer from 'ol/layer/Vector';
import { useMap } from '../../useMap';
import { currentMapKindAtom } from '../../../../store/session';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { FeatureType, GeoProperties, GeocoderTarget, MapKind, RegistItemDocument } from '../../../../graphql/generated/graphql';

type Props = {
    dataSourceId: string;   // 作図対象のデータソース
    close: () => void;  // 作図完了時のコールバック
}

enum Stage {
    SELECTING_FEATURE,
    DRAWING,
    CONFIRM,
    REGISTING,  // 登録中
}


export default function DrawStructureController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const drawingIcon = useRef<SystemIconDefine | null>(null);

    const draw = useRef<null | Draw>(null);
    const drawingFeature = useRef<Feature | undefined>(undefined);  // 描画中のFeature

    const spinner = useProcessMessage();
    const { map } = useMap();
    const pointStyleHook = usePointStyle();

    const [ mapKind ] = useAtom(currentMapKindAtom);
    const searchAddressRef = useRef<SearchAddressHandler>(null);
    const drawingLayer = useRef<VectorLayer<VectorSource>>();
    const drawingSource = useRef<VectorSource|null>(null);

    const drawReset = useCallback(() => {
        if (draw.current === null || !map) {
            return;
        }
        draw.current.abortDrawing();
        drawingFeature.current = undefined;
        drawingSource.current?.clear();
        map.removeInteraction(draw.current);
        draw.current = null;
    }, [map]);

    // 初期状態
    useEffect(() => {
        if (!map) return;
        
        drawingLayer.current = map.createDrawingLayer();
        drawingSource.current = drawingLayer.current.getSource();

        return () => {
            // UnMount時
            if (draw.current) {
                map.removeInteraction(draw.current);
            }
            if (drawingLayer.current) {
                map.removeDrawingLayer(drawingLayer.current);
            }
        }
    }, [map]);

    const onDrawEnd = useCallback((feature: Feature) => {
        if (!map) return;
        if (draw.current !== null) {
            map.removeInteraction(draw.current);
        }

        drawingFeature.current = feature;
        setStage(Stage.CONFIRM);

    }, [map]);

    /**
     * Drawing開始時の処理
     */
    const startDrawing = useCallback(() => {
        if (drawingIcon.current === null || !map) {
            return;
        }
        drawReset();
        const type = 'Point';
        const style = pointStyleHook.getDrawingStructureStyleFunction(drawingIcon.current);
        drawingLayer.current?.setStyle(style);
        drawingFeature.current = undefined;
        map.createDrawingLayer(style);
        draw.current = new Draw({
            source: drawingSource.current as VectorSource,
            type,
            style,
        });
        map.addInteraction(draw.current);
        draw.current.on('drawend', (event: DrawEvent) => {
            onDrawEnd(event.feature);
        });
        setStage(Stage.DRAWING);
    }, [map, drawReset, onDrawEnd, pointStyleHook])

    const onSelectedStructure = useCallback((iconDefine: SystemIconDefine) => {
        drawingIcon.current = iconDefine;
        startDrawing();
    }, [startDrawing]);

    const [ gqlClient ] = useAtom(clientAtom);

    const registFeatureFunc = useCallback(async() => {
        if (!drawingFeature.current) {
            console.warn('描画アイテムなし');
            return;
        }
        setStage(Stage.REGISTING);
        const h = spinner.showProcessMessage({
            overlay: true,
            spinner: true,
            message: '登録中...'
        });
        const geoJson = createGeoJson(drawingFeature.current);

        await gqlClient.mutation(RegistItemDocument, {
            datasourceId: props.dataSourceId,
            geometry: geoJson.geometry,
            geoProperties: Object.assign({}, geoJson.properties, {
                featureType: FeatureType.Structure,
                icon: {
                    type: drawingIcon.current?.type,
                    id: drawingIcon.current?.id,
                },
            } as GeoProperties),
        });
    
        spinner.hideProcessMessage(h);
        props.close();

    }, [gqlClient, props, spinner]);

    const onSelectAddress= useCallback((address: GeoJsonObject) => {
        if (!map) return;
        if (!drawingSource.current || !map) {
            return;
        }
        console.log('select', address);
        // 指定のアドレスにFeature追加
        const feature = new GeoJSON().readFeatures(address)[0];
        drawingSource.current.clear();
        drawingSource.current.addFeature(feature);

        // 指定のアドレスの場所に移動
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            map.fit(extent);

        onDrawEnd(feature);
    }, [onDrawEnd, map]);

    const onConfirmCancel = useCallback(() => {
        // DRAWモードに戻る
        startDrawing();

        // アドレス入力欄はクリア
        if (searchAddressRef.current) {
            searchAddressRef.current.clear();
        }
    }, [startDrawing]);

    const drawingMessage = useMemo(() => {
        if (mapKind === MapKind.Real) {
            return '任意の地点をクリックするか、住所を検索してください。';
        } else {
            return '任意の地点をクリックしてください。'
        }
    }, [mapKind]);

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <SelectStructureDialog ok={onSelectedStructure} cancel={() => props.close()} />
            );

        case Stage.DRAWING:
        case Stage.CONFIRM:
            const message = stage === Stage.DRAWING
                                ? drawingMessage
                                : 'この場所でよろしいですか。';
            const ok = stage === Stage.DRAWING
                                ? undefined
                                : registFeatureFunc;
            const cancel = stage === Stage.DRAWING
                                ? props.close
                                : onConfirmCancel;
            return (
                <PromptMessageBox 
                    message={message} 
                    ok={ok}
                    cancel={cancel}>
                        {mapKind === MapKind.Real &&
                            <SearchAddress
                                ref={searchAddressRef}
                                onAddress={onSelectAddress}
                                searchTarget={[GeocoderTarget.Point]}
                                disabled={stage === Stage.CONFIRM} />
                        }
                </PromptMessageBox>
            );
        
        default:
            console.log('current stage', stage);
            return null;
    }
}