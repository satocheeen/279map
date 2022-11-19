import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, Feature } from 'ol';
import SelectStructureDialog from './SelectStructureDialog';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { createGeoJson } from '../../../../util/MapUtility';
import usePointStyle from '../../usePointStyle';
import PromptMessageBox from '../PromptMessageBox';
import { useSpinner } from '../../../common/spinner/useSpinner';
import SearchAddress, { SearchAddressHandler } from '../../../common/SearchAddress';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../../store/configureStore';
import GeoJSON from 'ol/format/GeoJSON';
import { GeoJsonObject } from 'geojson';
import { registFeature } from '../../../../store/data/dataThunk';
import { SystemIconDefine } from '../../../../iconDefine';
import { FeatureType, GeoProperties, MapKind } from '279map-common/dist/types';

type Props = {
    map: Map;
    close: () => void;  // 作図完了時のコールバック
}

enum Stage {
    SELECTING_FEATURE,
    DRAWING,
    CONFIRM,
    REGISTING,  // 登録中
}

// 一度きりの生成でいいもの
const drawingSource = new VectorSource();
const drawingLayer = new VectorLayer({
    source: drawingSource,
    zIndex: 10,
});

export default function DrawStructureController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    // const unpointData = useRef<UnpointContent>();
    const drawingIcon = useRef<SystemIconDefine | null>(null);

    const draw = useRef<null | Draw>(null);
    const drawingFeature = useRef<Feature | undefined>(undefined);  // 描画中のFeature

    const dispatch = useAppDispatch();
    const spinner = useSpinner();
    const pointStyleHook = usePointStyle({
        structureLayer: drawingLayer,
    });

    const mapKind = useSelector((state: RootState) => state.data.mapKind);
    const searchAddressRef = useRef<SearchAddressHandler>(null);

    const onSelectedStructure = useCallback((iconDefine: SystemIconDefine) => {
        drawingIcon.current = iconDefine;
        setStage(Stage.DRAWING);
    }, []);

    const drawReset = useCallback(() => {
        if (draw.current === null) {
            return;
        }
        draw.current.abortDrawing();
        drawingFeature.current = undefined;
        drawingSource.clear();
        props.map.removeInteraction(draw.current);
        draw.current = null;
    }, [props.map]);

    // 初期状態
    useEffect(() => {
        const myDrawingSource = new VectorSource();
        props.map.addLayer(drawingLayer);

        return () => {
            // UnMount時
            drawReset();
            myDrawingSource.clear();
            props.map.removeLayer(drawingLayer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Drawing開始時の処理
     */
    useEffect(() => {
        if (stage !== Stage.DRAWING || drawingIcon.current === null) {
            return;
        }
        drawReset();
        const type = 'Point';
        const style = pointStyleHook.getStructureStyleFunction(() => {
            return {
                iconDefine: drawingIcon.current ? drawingIcon.current : undefined,
            };
        });
        drawingFeature.current = undefined;
        drawingSource.clear();
        drawingLayer.setStyle(style);
        draw.current = new Draw({
            source: drawingSource,
            type,
            style,
        });
        props.map.addInteraction(draw.current);
        draw.current.on('drawend', (event: DrawEvent) => {
            onDrawEnd(event.feature);
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage]);

    const registFeatureFunc = useCallback(async() => {
        if (!drawingFeature.current) {
            console.warn('描画アイテムなし');
            return;
        }
        setStage(Stage.REGISTING);
        spinner.showSpinner('登録中...');
        const geoJson = createGeoJson(drawingFeature.current);

        await dispatch(registFeature({
            geometry: geoJson.geometry,
            geoProperties: Object.assign({}, geoJson.properties, {
                featureType: FeatureType.STRUCTURE,
                icon: {
                    type: drawingIcon.current?.type,
                    id: drawingIcon.current?.id,
                },
            } as GeoProperties),
        }));
    
        spinner.hideSpinner();
        props.close();

    }, [dispatch, props, spinner]);

    const onDrawEnd = useCallback((feature: Feature) => {
        if (draw.current !== null) {
            props.map.removeInteraction(draw.current);
        }
        console.log('drawing feature', feature);

        drawingFeature.current = feature;
        setStage(Stage.CONFIRM);

    }, [props.map]);

    const onSelectAddress= useCallback((address: GeoJsonObject) => {
        console.log('select', address);
        // 指定のアドレスにFeature追加
        const feature = new GeoJSON().readFeatures(address)[0];
        drawingSource.clear();
        drawingSource.addFeature(feature);

        // 指定のアドレスの場所に移動
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            props.map.getView().fit(extent);

        onDrawEnd(feature);
    }, [onDrawEnd, props.map]);

    const onConfirmCancel = useCallback(() => {
        // DRAWモードに戻る
        setStage(Stage.DRAWING);

        // アドレス入力欄はクリア
        if (searchAddressRef.current) {
            searchAddressRef.current.clear();
        }
    }, []);

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
                                map={props.map} onAddress={onSelectAddress}
                                searchTarget={['point']}
                                disabled={stage === Stage.CONFIRM} />
                        }
                </PromptMessageBox>
            );
        
        default:
            console.log('current stage', stage);
            return null;
    }
}