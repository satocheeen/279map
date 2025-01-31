import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Collection, Feature, MapBrowserEvent } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { DragBox, Select, Translate } from 'ol/interaction';
import {platformModifierKeyOnly} from 'ol/events/condition';
import Geometry from 'ol/geom/Geometry';
import PromptMessageBox from '../PromptMessageBox';
import styles from './MoveItemController.module.scss';
import { containFeatureInLayer, createGeoJson, extractGeoProperty, getOriginalLine } from '../../../../util/MapUtility';
import { TranslateEvent } from 'ol/interaction/Translate';
import "react-toggle/style.css";
import Toggle from 'react-toggle';
import usePointStyle from '../../usePointStyle';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { useMap } from '../../useMap';
import { FeatureLike } from 'ol/Feature';
import { Style } from 'ol/style';
import useTopographyStyle from '../../useTopographyStyle';
import { topographySelectStyleFunction } from '../utility';
import { LineString, Polygon } from 'ol/geom';
import { useAtom } from 'jotai';
import { DataId, FeatureType, GeoProperties, MapKind } from '../../../../types-common/common-types';
import useItemProcess, { UpdateItemParam } from '../../../../store/item/useItemProcess';
import { currentMapKindAtom } from '../../../../store/session';

type Props = {
    close: () => void;  // 編集完了時のコールバック
}

const dragBox = new DragBox({
    className: 'ol-drag-box',   // MapChart.module.scss内でスタイル設定
    condition: platformModifierKeyOnly,
  });
const movedFeatureCollection = new Collection<Feature<Geometry>>();

/**
 * 地図上のアイテム（建物）を移動するコントローラ
 */
export default function MoveItemController(props: Props) {
    const [okable, setOkable] = useState(false);
    const { map } = useMap();
    const pointStyleHook = usePointStyle();
    const topographyStyleHook = useTopographyStyle({});
    const targetLayers = useRef<VectorLayer<VectorSource>[]>(
        function() {
            const pointLayer = map?.getLayersOfTheType(LayerType.Point) ?? [];
            const topographyLayer = map?.getLayersOfTheType(LayerType.Topography) ?? [];
            const layers = [...pointLayer, ...topographyLayer];
            return layers.filter(l => l.editable).map(l => l.layer)
        }()
    );

    const selectStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        if (feature.get('features')) {
            return pointStyleHook.selectedStyleFunction(feature, resolution);
        } else {
            const func = topographyStyleHook.getStyleFunction(topographySelectStyleFunction);
            return func(feature, resolution);
        }
    }, [pointStyleHook, topographyStyleHook]);

    const select = useMemo(() => {
        return new Select({
            layers: targetLayers.current,
            style: selectStyleFunction,
        });
    }, [selectStyleFunction]);

    const prevGeometoryRef = useRef<{[id: string]: Geometry}>({});
    const [multipleMode, setMultipleMode] = useState(false);    // 複数選択モードの場合、true

    useEffect(() => {
        movedFeatureCollection.clear();
        // 移動前の状態を記憶
        targetLayers.current.forEach(layer => {
            layer.getSource()?.getFeatures().forEach((feature) => {
                const features = (feature.get('features') as Feature<Geometry>[] | undefined) ?? [feature];
                const id = features[0].getId();
                const geometry = feature.getGeometry();
                if (id === undefined || !geometry) {
                    return;
                }
                prevGeometoryRef.current[id] = geometry.clone();
            });
        })
    }, [])

    const { updateItems } = useItemProcess();
    const onFinishClicked = async() => {
        // DB更新用にデータ加工
        const targets = [] as UpdateItemParam[];
        for (const mf of movedFeatureCollection.getArray()) {
            const mfGeoJson = createGeoJson(mf);
            const features = (mf.get('features') as Feature<Geometry>[] | undefined) ?? [mf];
            for (const feature of features) {
                let geometry: GeoJSON.Geometry;
                if ((feature.getProperties() as GeoProperties).featureType === FeatureType.ROAD) {
                    // 道の場合は、元のラインを射影変換する
                    const lineFeature = getOriginalLine(feature as Feature<Geometry>);
                    const id = feature.getId() as string;
                    const myPrev = prevGeometoryRef.current[id];
                    const prevP = (myPrev as Polygon).getCoordinates()[0][0];
                    const currentP = (feature.getGeometry() as Polygon).getCoordinates()[0][0];
                    const dx = currentP[0] - prevP[0];
                    const dy = currentP[1] - prevP[1];
                    (lineFeature.getGeometry() as LineString).translate(dx, dy);
                    const geoJson = createGeoJson(lineFeature);
                    geometry = geoJson.geometry;
                } else {
                    geometry = mfGeoJson.geometry;
                }

                const id = feature.getId() as DataId;

                // 同じアイテムが存在する場合（移動操作を複数回行った場合）は、上書き
                const index = targets.findIndex(t => t.id === id);
                if (index === -1) {
                    targets.push({
                        id,
                        geometry,
                        geoProperties: extractGeoProperty(feature.getProperties() as GeoProperties),
                    })
                } else {
                    targets.splice(index, 1, {
                        id,
                        geometry,
                        geoProperties: extractGeoProperty(feature.getProperties() as GeoProperties),
                    })
                }
            }
        }
        console.log('updateItems', targets);
        updateItems(targets);
        props.close();
    }

    const onCancelClicked = () => {
        // 元に戻す
        movedFeatureCollection.forEach((feature) => {
            const features = (feature.get('features') as Feature<Geometry>[] | undefined) ?? [feature];
            const id = features[0].getId();
            if (id === undefined) {
                return;
            }
            const geometory = prevGeometoryRef.current[id];
            feature.setGeometry(geometory);
        })
        props.close();
    }

    // 対象アイテムhover時のカーソル設定
    useEffect(() => {
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            const targets = map?.getNearlyFeatures(evt.pixel) ?? [];
            const isHover = targets.some(target => {
                return targetLayers.current.some(layer => {
                    return containFeatureInLayer(target.feature, layer);
                });
            });

            if (isHover) {
                map?.setCursorStyle('pointer');
            } else {
                map?.setCursorStyle('');
            }
        };
        map?.on('pointermove', pointerMoveEvent);

        return () => {
            map?.un('pointermove', pointerMoveEvent);
        }

    }, [map]);

    // ボックス選択の初期化
    useEffect(() => {
        dragBox.on('boxend', () => {
            // Extent内の建物を選択状態にする
            const extent = dragBox.getGeometry().getExtent();
            targetLayers.current.forEach(layer => {
                layer.getSource()?.forEachFeature((feature) => {
                    const geometry = feature.getGeometry()?.clone();
                    if (!geometry) {
                        return;
                    }
                    if (geometry.intersectsExtent(extent)) {
                        select.getFeatures().push(feature);
                    }
                })
            });
        });
        map?.addInteraction(dragBox);

        return () => {
            map?.removeInteraction(dragBox);
        };
    }, [map, select]);

    useEffect(() => {
        let translate : Translate;
        if (multipleMode) {
            // 複数選択モードの場合
            translate = new Translate({
                layers: targetLayers.current,
                features: select.getFeatures(),
            });
            map?.addInteraction(select);
            map?.addInteraction(dragBox);
        } else {
            // 単一モードの場合
            translate = new Translate({
                layers: targetLayers.current,
            });
            select.getFeatures().clear();
            map?.removeInteraction(select);
            map?.removeInteraction(dragBox);
        }

        translate.on('translateend', (e: TranslateEvent) => {
            e.features.forEach((feature) => {
                movedFeatureCollection.push(feature);
            });
            setOkable(true);
        });
        map?.addInteraction(translate);

        return () => {
            map?.removeInteraction(translate);
            map?.removeInteraction(select);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multipleMode]);

    const onMultipleModeToggleClicked = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setMultipleMode(value);

    };

    const [ currentMapKind ] = useAtom(currentMapKindAtom);
    const { message1, message2 } = useMemo(() => {
        const target = currentMapKind === MapKind.Real ? 'ピンまたはエリア' : '建物または土地';
        if (multipleMode) {
            return {
                message1: `移動したい${target}を選択の上、D&Dで移動してください。`,
                message2: "複数選択する場合->Shift+クリック\n矩形選択する場合->Ctrl+矩形描画",
            }
        } else {
            return {
                message1: `移動したい${target}をD&Dで移動してください`,
                message2: undefined,
            }
        }    
    }, [multipleMode, currentMapKind]);

    return (
        <PromptMessageBox message={message1} ok={onFinishClicked} okname="完了" cancel={onCancelClicked} okdisabled={!okable}>
            <>
                <div className={`${styles.mode}`}>
                    <label>選択モード</label>
                    <Toggle id={'toggle-multiple'} defaultChecked={false}
                        icons={{
                            unchecked: <i className="icon-house"></i>,
                            checked: <i className="icon-house-multiple"></i>,
                        }}
                        className={`my-toggle ${styles.toggle}`}
                    onChange={onMultipleModeToggleClicked} />
                </div>
                <div className={styles.subMessage}>
                    {message2}
                </div>
            </>
        </PromptMessageBox>
    );
}