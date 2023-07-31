import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../../common/button/Button';
import Modal from  '../../../common/modal/Modal';
import styles from './SelectStructureDialog.module.scss';
import { MapKind } from '279map-common';
import { SystemIconDefine } from '../../../../types/types';
import { useRecoilValue } from 'recoil';
import { currentMapIconDefineState } from '../../../../store/icon';
import { currentMapKindState } from '../../../../store/session';

type Props = {
    currentIconId?: string;         // 現在の画像ID
    cancel?: () => void;    // Cancel押下時のコールバック
    ok?: (selectIcon: SystemIconDefine) => void;        // OK押下時のコールバック
}

export default function SelectStructureDialog(props: Props) {
    const [show, setShow] = useState(true);
    const currentMapIconDefine = useRecoilValue(currentMapIconDefineState);
    const [selectedDefine, setSelectedDefine] = useState(null as SystemIconDefine | null);
    const mapKind = useRecoilValue(currentMapKindState);

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
            return <li className={className} key={def.imagePath}
                onClick={()=>onSelect(def)}>
                <img src={def.imagePath} alt={def.id} style={def.menuViewCustomCss} />
            </li>
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