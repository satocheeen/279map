import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Feature } from 'ol';
import Draw, { DrawEvent } from "ol/interaction/Draw";
import VectorSource from 'ol/source/Vector';
import { createGeoJson } from '../../../../util/MapUtility';
import usePointStyle from '../../usePointStyle';
import PromptMessageBox from '../PromptMessageBox';
import SearchAddress, { SearchAddressHandler } from '../../../common/SearchAddress';
import GeoJSON from 'ol/format/GeoJSON';
import { GeoJsonObject } from 'geojson';
import VectorLayer from 'ol/layer/Vector';
import { useMap } from '../../useMap';
import { currentMapKindAtom } from '../../../../store/session';
import { useAtom } from 'jotai';
import { GeocoderTarget } from '../../../../graphql/generated/graphql';
import { FeatureType, MapKind, GeoProperties, IconKey } from '../../../../types-common/common-types';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { ItemGeoInfo } from '../../../../entry';
import useIcon from '../../../../store/icon/useIcon';

type Props = {
    dataSourceId: string;   // 作図対象のデータソース
    iconKey?: IconKey;  // 指定時、指定のアイコンで描画する。未指定時はデフォルトアイコンを用いる。
    onCancel: () => void;
    onCommit: (item: ItemGeoInfo) => void;
}

enum Stage {
    DRAWING,
    CONFIRM,
}

/**
 * Point描画用コントローラ
 * @param props 
 * @returns 
 */
export default function DrawPointController(props: Props) {
    const [stage, setStage] = useState(Stage.DRAWING);
    const { getIconDefine } = useIcon();
    const drawingIcon = useMemo(() => {
        return getIconDefine(props.iconKey);

    }, [getIconDefine, props.iconKey])
    // const drawingIcon = useRef<SystemIconDefine | null>(null);

    const draw = useRef<null | Draw>(null);
    const drawingFeature = useRef<Feature | undefined>(undefined);  // 描画中のFeature

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
        
        drawingLayer.current = map.createDrawingLayer(LayerType.Point);
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
        if (!map) {
            return;
        }
        drawReset();
        const type = 'Point';
        const style = pointStyleHook.getDrawingStructureStyleFunction(drawingIcon);
        drawingLayer.current?.setStyle(style);
        drawingFeature.current = undefined;
        map.createDrawingLayer(LayerType.Point, style);
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
    }, [map, drawReset, onDrawEnd, pointStyleHook, drawingIcon])

    const handleOk = useCallback(() => {
        if (!drawingFeature.current) {
            console.warn('描画アイテムなし');
            return;
        }
        const geoJson = createGeoJson(drawingFeature.current);

        const geoProperties = Object.assign({}, geoJson.properties, {
            featureType: FeatureType.STRUCTURE,
            icon: drawingIcon,
        } as GeoProperties);

        props.onCommit({
            geometry: geoJson.geometry,
            geoProperties,
        });

    }, [props, drawingIcon]);

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

    const message = useMemo(() => {
        if (stage === Stage.DRAWING) {
            if (mapKind === MapKind.Real) {
                return '任意の地点をクリックするか、住所を検索してください。';
            } else {
                return '任意の地点をクリックしてください。'
            }
    
        } else {
            return 'この場所でよろしいですか。';
        }
    }, [stage, mapKind])

    const cancel = useCallback(() => {
        if (stage === Stage.DRAWING) {
            props.onCancel();
        }
        onConfirmCancel();
    }, [stage, onConfirmCancel, props]);

    return (
        <PromptMessageBox 
            message={message} 
            ok={handleOk}
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

}