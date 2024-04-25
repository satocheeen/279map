import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../../common/button/Button';
import Modal from  '../../../common/modal/Modal';
import styles from './SelectStructureDialog.module.scss';
import { SystemIconDefine, currentMapIconDefineAtom } from '../../../../store/icon';
import { currentMapKindAtom } from '../../../../store/session';
import { useAtom } from 'jotai';
import { MapKind } from '../../../../types-common/common-types';

type Props = {
    currentIconId?: string;         // 現在の画像ID
    cancel?: () => void;    // Cancel押下時のコールバック
    ok?: (selectIcon: SystemIconDefine) => void;        // OK押下時のコールバック
}

export default function SelectStructureDialog(props: Props) {
    const [show, setShow] = useState(true);
    const [ currentMapIconDefine ] = useAtom(currentMapIconDefineAtom);
    const [selectedDefine, setSelectedDefine] = useState(null as SystemIconDefine | null);
    const [ mapKind ] = useAtom(currentMapKindAtom);

    useEffect(() => {
        if (props.currentIconId !== undefined) {
            let hit = currentMapIconDefine.find((def) => {
                return props.currentIconId === def.id;
            });
            if (hit !== undefined) {
                setSelectedDefine(hit);
            }
        }
    }, [props.currentIconId, currentMapIconDefine]);

    const title = useMemo((): string => {
        if (props.currentIconId !== undefined) {
            return mapKind === MapKind.Virtual ? '改築' : 'ピン変更';
        }
        return mapKind === MapKind.Virtual ? '建物選択' : 'ピン選択';
    }, [props.currentIconId, mapKind]);

    const okDisable = useMemo((): boolean => {
        if (selectedDefine === null) {
            return true;
        }
        if (props.currentIconId === selectedDefine.id) {
            return true;
        }
        return false;
    }, [selectedDefine, props.currentIconId]);

    const onSelect = useCallback((def: SystemIconDefine) => {
        setSelectedDefine(def);
    }, []);

    const onCancel = useCallback(() => {
        if (props.cancel) {
            props.cancel();
        }
        setShow(false);
    }, [props]);

    const onOk = useCallback(() => {
        if (props.ok) {
            props.ok(selectedDefine as SystemIconDefine);
        }
        setShow(false);
    }, [selectedDefine, props]);

    const imageList = useMemo(() => {
        const imageList = currentMapIconDefine.map((def: SystemIconDefine) => {
            let className = styles.listGroupItem;
            if (def.imagePath === selectedDefine?.imagePath) {
                className += " " + styles.active;
            }

            return (
                <li className={className} key={def.imagePath}
                    onClick={()=>onSelect(def)}>
                        <IconImage def={def} />
                </li>
            )
        });
        return (
            <ul className={styles.listGroup}>
                {imageList}
            </ul>
        );
    }, [selectedDefine, onSelect, currentMapIconDefine]);

    const message = useMemo(() => {
        return mapKind === MapKind.Virtual ? '建物を選択してください。' : 'ピンを選択してください。'
    }, [mapKind]);

    return (
        <Modal show={show}>
            <Modal.Header>
                {title}
            </Modal.Header>
            <Modal.Body>
                <div className={styles.SelectStructureDialog}>
                    <div>{message}</div>
                    {imageList}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                        Cancel
                </Button>
                <Button variant="primary" onClick={onOk} disabled={okDisable}>
                        OK
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

type IconImageProps = {
    def: SystemIconDefine;
}
function IconImage({ def }: IconImageProps) {
    const [svgData, setSvgData] = useState<string|null>(null);

    const isSvg = useMemo(() => def.imagePath.endsWith('.svg'), [def]);

    useEffect(() => {
        if (!isSvg) return;
        const fetchSvgData = async () => {
            try {
                const response = await fetch(def.imagePath);
                const data = await response.text();
                if (def.defaultColor) {
                    const modifiedData = addFillStyle(data, def.defaultColor, 'my-color');
                    setSvgData(modifiedData);
                } else {
                    setSvgData(data);
                }
            } catch (error) {
                console.error('SVGファイルの読み込みに失敗しました:', error);
            }
        };
  
          fetchSvgData();
    }, [def, isSvg]);
  
    if (!isSvg) {
        return (
            <img src={def.imagePath} alt={def.id} />
        )
    }
    if (!svgData) return null;
    return (
      <div dangerouslySetInnerHTML={{ __html: svgData }} />
    );
}

const addFillStyle = (svgData: string, fillColor: string, targetClass: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const targetElements = doc.getElementsByClassName(targetClass);

    for (let i = 0; i < targetElements.length; i++) {
      targetElements[i].setAttribute('fill', fillColor);
    }

    return new XMLSerializer().serializeToString(doc);
  };