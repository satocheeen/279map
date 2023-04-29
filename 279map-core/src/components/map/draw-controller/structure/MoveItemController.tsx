import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Map, Collection, Feature, MapBrowserEvent } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { DragBox, Select, Translate } from 'ol/interaction';
import {platformModifierKeyOnly} from 'ol/events/condition';
import Geometry from 'ol/geom/Geometry';
import PromptMessageBox from '../PromptMessageBox';
import styles from './MoveItemController.module.scss';
import { createGeoJson } from '../../../../util/MapUtility';
import { TranslateEvent } from 'ol/interaction/Translate';
import "react-toggle/style.css";
import Toggle from 'react-toggle';
import usePointStyle from '../../usePointStyle';
import { useSpinner } from '../../../common/spinner/useSpinner';
import { useAppDispatch } from '../../../../store/configureStore';
import { updateFeature } from '../../../../store/data/dataThunk';
import { MapChartContext } from '../../../TsunaguMap/MapChart';
import { convertDataIdFromFeatureId } from '../../../../store/data/dataUtility';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';

type Props = {
    close: () => void;  // 編集完了時のコールバック
}

const dragBox = new DragBox({
    condition: platformModifierKeyOnly,
  });
const movedFeatureCollection = new Collection<Feature<Geometry>>();

/**
 * 地図上のアイテム（建物）を移動するコントローラ
 */
export default function MoveItemController(props: Props) {
    const [okable, setOkable] = useState(false);
    const { map } = useContext(MapChartContext);
    const pointStyleHook = usePointStyle({ map });
    const dispatch = useAppDispatch();
    const targetLayers = useRef<VectorLayer<VectorSource>[]>(
        map.getLayersOfTheType(LayerType.Point).filter(l => l.editable).map(l => l.layer)
    );

    const select = useMemo(() => {
        return new Select({
            layers: targetLayers.current,
            style: pointStyleHook.selectedStyleFunction,
        });
    }, [pointStyleHook]);

    const [prevGeometory] = useState({} as {[id: string]: Geometry});
    const [multipleMode, setMultipleMode] = useState(false);    // 複数選択モードの場合、true
    const spinnerHook = useSpinner();
    
    const onFinishClicked = async() => {
        spinnerHook.showSpinner('更新中...');
        for (const mf of movedFeatureCollection.getArray()) {
            const mfGeoJson = createGeoJson(mf);
            const features = mf.get('features') as Feature<Geometry>[];
            for (const feature of features) {
                // DB更新
                const id = convertDataIdFromFeatureId(feature.getId() as string);
                await dispatch(updateFeature({
                    id,
                    geometry: mfGeoJson.geometry,
                }));
            }
        }
        spinnerHook.hideSpinner();
        props.close();
    }

    const onCancelClicked = () => {
        // 元に戻す
        movedFeatureCollection.forEach((feature) => {
            const id = feature.getId();
            if (id === undefined) {
                return;
            }
            const geometory = prevGeometory[id];
            feature.setGeometry(geometory);
        })
        props.close();
    }

    // 対象アイテムhover時のカーソル設定
    useEffect(() => {
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            const items = map.getNearlyFeatures(evt.pixel);
            const isHover = items.some(item => {
                const itemsLayers = map.getDataSourceLayers(item.dataSourceId);
                return itemsLayers.some(il => {
                    return targetLayers.current?.includes(il);
                });
            });

            if (isHover) {
                map.setCursorStyle('pointer');
            } else {
                map.setCursorStyle('');
            }
        };
        map.on('pointermove', pointerMoveEvent);

        return () => {
            map.un('pointermove', pointerMoveEvent);
        }

    }, [map]);

    useEffect(() => {
        // 移動前の状態を記憶
        targetLayers.current.forEach(layer => {
            layer.getSource()?.getFeatures().forEach((feature) => {
                const id = feature.getId();
                const geometry = feature.getGeometry();
                if (id === undefined || !geometry) {
                    return;
                }
                prevGeometory[id] = geometry.clone();
            });
        })

    }, [prevGeometory]);

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
        map.addInteraction(dragBox);

        return () => {
            map.removeInteraction(dragBox);
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
            map.addInteraction(select);
            map.addInteraction(dragBox);
        } else {
            // 単一モードの場合
            translate = new Translate({
                layers: targetLayers.current,
            });
            select.getFeatures().clear();
            map.removeInteraction(select);
            map.removeInteraction(dragBox);
        }

        translate.on('translateend', (e: TranslateEvent) => {
            e.features.forEach((feature) => {
                movedFeatureCollection.push(feature);
            });
            setOkable(true);
        });
        map.addInteraction(translate);

        return () => {
            map.removeInteraction(translate);
            map.removeInteraction(select);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multipleMode]);

    const onMultipleModeToggleClicked = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setMultipleMode(value);

    };

    let message1: string;
    let message2: string | undefined;
    if (multipleMode) {
        message1 = "移動したい建物を選択の上、D&Dで移動してください。";
        message2 = "複数選択する場合->Shift+クリック\n矩形選択する場合->Ctrl+矩形描画";
    } else {
        message1 = "移動したい建物をD&Dで移動してください";
    }
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