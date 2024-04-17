import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeatureType } from '../../../../types-common/common-types';
import PromptMessageBox from '../PromptMessageBox';
import { currentMapKindAtom } from '../../../../store/session';
import { useAtom } from 'jotai';
import { GeocoderTarget, MapKind } from '../../../../graphql/generated/graphql';
import SearchAddress, { SearchAddressHandler } from '../../../common/SearchAddress';
import { GeoJsonObject } from 'geojson';
import { useMap } from '../../useMap';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Feature } from 'ol';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import usePointStyle from '../../usePointStyle';
import { currentDefaultIconAtom } from '../../../../store/icon';
import VectorLayer from 'ol/layer/Vector';
import { createGeoJson } from '../../../../util/MapUtility';

type Props = {
    featureType: FeatureType;
    onCancel: () => void;
    onCommit: (geometry: GeoJSON.GeoJSON) => void;
}

enum Stage {
    DRAWING,
    CONFIRM,
}

/**
 * ユーザに指定の種別のFeatureを描画させて、その結果を返す。
 * 現状は、POINT(STRUCTURE)にのみ対応。
 * @param props 
 * @returns 
 */
export default function DrawTemporaryFeatureController(props: Props) {
    const [ stage, setStage ] = useState(Stage.DRAWING);
    const [ mapKind ] = useAtom(currentMapKindAtom);
    const searchAddressRef = useRef<SearchAddressHandler>(null);
    const { map } = useMap();
    const [ currentDefaultIcon ] = useAtom(currentDefaultIconAtom);
    const { getDrawingStructureStyleFunction } = usePointStyle();
    const drawingLayer = useRef<VectorLayer<VectorSource>>();
    const drawRef = useRef<null | Draw>(null);
    const drawingFeature = useRef<Feature | undefined>(undefined);  // 描画中のFeature

    const onDrawEnd = useCallback((feature: Feature) => {
        if (!map) return;
        if (drawRef.current !== null) {
            map.removeInteraction(drawRef.current);
        }

        drawingFeature.current = feature;
        setStage(Stage.CONFIRM);

    }, [map]);

    /**
     * Drawing開始時の処理
     */
    const startDrawing = useCallback(() => {
        if (!map) {
            return;
        }
        if (!drawRef.current) {
            return;
        }

        // map.createDrawingLayer(style);
        drawRef.current.on('drawend', (event: DrawEvent) => {
            onDrawEnd(event.feature);
        });


        map.addInteraction(drawRef.current);
        setStage(Stage.DRAWING);

    }, [map, onDrawEnd])    


    // 初期状態
    useEffect(() => {
        if (!map) return;
        
        const style = getDrawingStructureStyleFunction(currentDefaultIcon);
        console.log('style', style);
        drawingLayer.current = map.createDrawingLayer();
        drawingLayer.current?.setStyle(style);

        drawRef.current = new Draw({
            source: drawingLayer.current.getSource() as VectorSource, //drawingSource.current as VectorSource,
            type: 'Point',
            style,
        });

        startDrawing();

        return () => {
            // UnMount時
            if (drawRef.current) {
                map.removeInteraction(drawRef.current);
            }
            if (drawingLayer.current) {
                map.removeDrawingLayer(drawingLayer.current);
            }
        }
    }, [map, startDrawing, currentDefaultIcon, getDrawingStructureStyleFunction]);

    const message = useMemo(() => {
        switch(stage) {
            case Stage.DRAWING:
                if (mapKind === MapKind.Real) {
                    return '任意の地点をクリックするか、住所を検索してください。';
                } else {
                    return '任意の地点をクリックしてください。'
                }
                    
            case Stage.CONFIRM:
                return 'この場所でよろしいですか。';
        }

    }, [stage, mapKind])


    const onSelectAddress= useCallback((address: GeoJsonObject) => {
        if (!map) return;
        if (!drawingLayer.current || !map) {
            return;
        }
        console.log('select', address);
        // 指定のアドレスにFeature追加
        const feature = new GeoJSON().readFeatures(address)[0];
        drawingLayer.current.getSource()?.clear();
        drawingLayer.current.getSource()?.addFeature(feature);

        // 指定のアドレスの場所に移動
        const extent = feature.getGeometry()?.getExtent();
        if (extent)
            map.fit(extent);

        onDrawEnd(feature);
    }, [onDrawEnd, map]);

    const handleCancel = useCallback(() => {
        switch(stage) {
            case Stage.DRAWING:
                props.onCancel();
                break;
                    
            case Stage.CONFIRM:
                drawingLayer.current?.getSource()?.clear();
                startDrawing();
                break;
        }
    }, [props, stage, startDrawing])

    const handleOk = useCallback(() => {
        if (!drawingFeature.current) {
            console.warn('描画アイテムなし');
            return;
        }
        const geoJson = createGeoJson(drawingFeature.current);
        props.onCommit(geoJson.geometry)
    }, [props]);

    return (
        <PromptMessageBox 
            message={message} 
            ok={stage === Stage.CONFIRM ? handleOk : undefined}
            cancel={handleCancel}>
                {mapKind === MapKind.Real &&
                    <SearchAddress
                        ref={searchAddressRef}
                        onAddress={onSelectAddress}
                        searchTarget={[GeocoderTarget.Point]}
                        disabled={stage === Stage.CONFIRM} />
                }
        </PromptMessageBox>
);
}