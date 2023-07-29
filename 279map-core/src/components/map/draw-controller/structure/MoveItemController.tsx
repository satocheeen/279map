import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Collection, Feature, MapBrowserEvent } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { DragBox, Select, Translate } from 'ol/interaction';
import {platformModifierKeyOnly} from 'ol/events/condition';
import Geometry from 'ol/geom/Geometry';
import PromptMessageBox from '../PromptMessageBox';
import styles from './MoveItemController.module.scss';
import { containFeatureInLayer, createGeoJson } from '../../../../util/MapUtility';
import { TranslateEvent } from 'ol/interaction/Translate';
import "react-toggle/style.css";
import Toggle from 'react-toggle';
import usePointStyle from '../../usePointStyle';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import { convertDataIdFromFeatureId } from '../../../../store/data/dataUtility';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { useMap } from '../../useMap';
import { UpdateItemAPI } from 'tsunagumap-api';

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
    const { getMap } = useMap();
    const pointStyleHook = usePointStyle();
    const targetLayers = useRef<VectorLayer<VectorSource>[]>(
        (getMap()?.getLayersOfTheType(LayerType.Point) ?? []).filter(l => l.editable).map(l => l.layer)
    );

    const select = useMemo(() => {
        return new Select({
            layers: targetLayers.current,
            style: pointStyleHook.selectedStyleFunction,
        });
    }, [pointStyleHook]);

    const [prevGeometory] = useState({} as {[id: string]: Geometry});
    const [multipleMode, setMultipleMode] = useState(false);    // 複数選択モードの場合、true
    const spinnerHook = useProcessMessage();
    const { getApi } = useMap();

    const onFinishClicked = async() => {
        const h = spinnerHook.showProcessMessage({
            overlay: true,
            spinner: true,
            message: '更新中...'
        });
        for (const mf of movedFeatureCollection.getArray()) {
            const mfGeoJson = createGeoJson(mf);
            const features = mf.get('features') as Feature<Geometry>[];
            for (const feature of features) {
                // DB更新
                const id = convertDataIdFromFeatureId(feature.getId() as string);
                await getApi().callApi(UpdateItemAPI, {
                    id,
                    geometry: mfGeoJson.geometry,
                });
            }
        }
        spinnerHook.hideProcessMessage(h);
        props.close();
    }

    const onCancelClicked = () => {
        // 元に戻す
        movedFeatureCollection.forEach((clusteredFeature) => {
            const features = clusteredFeature.get('features') as Feature<Geometry>[];
            const id = features[0].getId();
            if (id === undefined) {
                return;
            }
            const geometory = prevGeometory[id];
            clusteredFeature.setGeometry(geometory);
        })
        props.close();
    }

    // 対象アイテムhover時のカーソル設定
    useEffect(() => {
        const pointerMoveEvent = (evt: MapBrowserEvent<any>) => {
            const targets = getMap()?.getNearlyFeatures(evt.pixel) ?? [];
            const isHover = targets.some(target => {
                return targetLayers.current.some(layer => {
                    return containFeatureInLayer(target.feature, layer);
                });
            });

            if (isHover) {
                getMap()?.setCursorStyle('pointer');
            } else {
                getMap()?.setCursorStyle('');
            }
        };
        getMap()?.on('pointermove', pointerMoveEvent);

        return () => {
            getMap()?.un('pointermove', pointerMoveEvent);
        }

    }, [getMap]);

    useEffect(() => {
        // 移動前の状態を記憶
        targetLayers.current.forEach(layer => {
            layer.getSource()?.getFeatures().forEach((clusteredFeature) => {
                const features = clusteredFeature.get('features') as Feature<Geometry>[];
                const id = features[0].getId();
                const geometry = clusteredFeature.getGeometry();
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
        getMap()?.addInteraction(dragBox);

        return () => {
            getMap()?.removeInteraction(dragBox);
        };
    }, [getMap, select]);

    useEffect(() => {
        let translate : Translate;
        if (multipleMode) {
            // 複数選択モードの場合
            translate = new Translate({
                layers: targetLayers.current,
                features: select.getFeatures(),
            });
            getMap()?.addInteraction(select);
            getMap()?.addInteraction(dragBox);
        } else {
            // 単一モードの場合
            translate = new Translate({
                layers: targetLayers.current,
            });
            select.getFeatures().clear();
            getMap()?.removeInteraction(select);
            getMap()?.removeInteraction(dragBox);
        }

        translate.on('translateend', (e: TranslateEvent) => {
            e.features.forEach((feature) => {
                movedFeatureCollection.push(feature);
            });
            setOkable(true);
        });
        getMap()?.addInteraction(translate);

        return () => {
            getMap()?.removeInteraction(translate);
            getMap()?.removeInteraction(select);
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