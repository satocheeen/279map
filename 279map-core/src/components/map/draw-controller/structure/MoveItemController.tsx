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

type Props = {
    map: Map;
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
    const itemLayer = useRef(props.map.getAllLayers().find(layer => layer.getProperties()['name'] === 'itemLayer') as VectorLayer<VectorSource>);
    const { map } = useContext(MapChartContext);
    const pointStyleHook = usePointStyle({ map });
    const dispatch = useAppDispatch();

    const select = useMemo(() => {
        return new Select({
            layers: [itemLayer.current],
            style: pointStyleHook.selectedStyleFunction,
        });
    }, [itemLayer, pointStyleHook]);

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
                await dispatch(updateFeature({
                    id: {
                        id: feature.getId() as string,
                        dataSourceId: '',   // TODO: data_source_id
                    },
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
            let isHover = false;
            props.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                const layerName = layer.getProperties()['name'];
                if (layerName === 'itemLayer') {
                    isHover = true;
                }
            });
            if (isHover) {
                props.map.getTargetElement().style.cursor = 'pointer';
            } else {
                props.map.getTargetElement().style.cursor = '';
            }
        };
        props.map.on('pointermove', pointerMoveEvent);

        return () => {
            props.map.un('pointermove', pointerMoveEvent);
        }

    }, [props.map]);

    useEffect(() => {
        // 移動前の状態を記憶
        itemLayer.current.getSource()?.getFeatures().forEach((feature) => {
            const id = feature.getId();
            const geometry = feature.getGeometry();
            if (id === undefined || !geometry) {
                return;
            }
            prevGeometory[id] = geometry.clone();
        });

    }, [itemLayer, prevGeometory]);

    // ボックス選択の初期化
    useEffect(() => {
        dragBox.on('boxend', () => {
            // Extent内の建物を選択状態にする
            const extent = dragBox.getGeometry().getExtent();
            itemLayer.current.getSource()?.forEachFeature((feature) => {
                const geometry = feature.getGeometry()?.clone();
                if (!geometry) {
                    return;
                }
                if (geometry.intersectsExtent(extent)) {
                    select.getFeatures().push(feature);
                }
            })
        });
        props.map.addInteraction(dragBox);

        return () => {
            props.map.removeInteraction(dragBox);
        };
    }, [props.map, select]);

    useEffect(() => {
        let translate : Translate;
        if (multipleMode) {
            // 複数選択モードの場合
            translate = new Translate({
                layers: [itemLayer.current],
                features: select.getFeatures(),
            });
            props.map.addInteraction(select);
            props.map.addInteraction(dragBox);
        } else {
            // 単一モードの場合
            translate = new Translate({
                layers: [itemLayer.current],
            });
            console.log('clear');
            select.getFeatures().clear();
            props.map.removeInteraction(select);
            props.map.removeInteraction(dragBox);
        }

        translate.on('translateend', (e: TranslateEvent) => {
            e.features.forEach((feature) => {
                movedFeatureCollection.push(feature);
            });
            setOkable(true);
        });
        props.map.addInteraction(translate);

        return () => {
            props.map.removeInteraction(translate);
            props.map.removeInteraction(select);
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