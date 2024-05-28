import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Modal from  './modal/Modal';
import styles from './SelectStructureDialog.module.scss';
import { DriverContext } from '../TestMap';
import { IconKey, MapKind, SystemIconDefine } from '../../entry';
import useModal, { createModal } from './useModal';

export type SelectStructureDialogParams = {
    currentIconId?: string;         // 現在の画像ID
    icons: SystemIconDefine[];
}
export type SelectStructureDialogResult = IconKey | null;

export default createModal<{}, SelectStructureDialogParams, SelectStructureDialogResult> (
    (props, ref) => {
        const { isOpen, close, param } = useModal(ref);
        const { mapKind } = useContext(DriverContext);
        const [selectedDefine, setSelectedDefine] = useState<IconKey|null>(null);

        useEffect(() => {
            if (param?.currentIconId !== undefined) {
                let hit = param.icons.find((def) => {
                    return param.currentIconId === def.id;
                });
                if (hit !== undefined) {
                    setSelectedDefine(hit);
                }
            }
        }, [param]);
    
        const title = useMemo((): string => {
            if (param?.currentIconId !== undefined) {
                return mapKind === MapKind.Virtual ? '改築' : 'ピン変更';
            }
            return mapKind === MapKind.Virtual ? '建物選択' : 'ピン選択';
        }, [param, mapKind]);
    
        const message = useMemo(() => {
            return mapKind === MapKind.Virtual ? '建物を選択してください。' : 'ピンを選択してください。'
        }, [mapKind]);

        const onSelect = useCallback((def: SystemIconDefine) => {
            setSelectedDefine(def);
        }, []);
    
        const imageList = useMemo(() => {
            if (!param) return [];
            const imageList = param.icons.map((def: SystemIconDefine) => {
                let className = styles.listGroupItem;
                if (def.type === selectedDefine?.type && def.id === selectedDefine.id) {
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
        }, [selectedDefine, onSelect, param]);

        const okDisable = useMemo((): boolean => {
            if (selectedDefine === null) {
                return true;
            }
            if (param?.currentIconId === selectedDefine.id) {
                return true;
            }
            return false;
        }, [selectedDefine, param]);
    
        const onCancel = useCallback(() => {
            close(null);
        }, [close]);
    
        const onOk = useCallback(() => {
            close(selectedDefine);
        }, [selectedDefine, close]);

        return (
            <Modal show={isOpen}>
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
                    <button onClick={onCancel}>
                        Cancel
                    </button>
                    <button onClick={onOk} disabled={okDisable}>
                        OK
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
)

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