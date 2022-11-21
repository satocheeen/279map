import { MapKind } from '279map-common';
import React, { useMemo, useContext } from 'react';
import { ListGroup } from 'react-bootstrap';
import { TbCircle, TbHexagon } from 'react-icons/tb';
import { OwnerContext } from '../../../TsunaguMap/TsunaguMap';
import styles from './SelectDrawFeature.module.scss';

export enum DrawFeatureType {
    FreePolygon,
    FreeCircle,
    AddressArea,
    AddressPointRadius,
}
type Props = {
    onSelect: (selected: DrawFeatureType) => void;
}

export default function SelectDrawFeature(props: Props) {
    const ownerContext =  useContext(OwnerContext);
    const mapKind = useMemo(() => ownerContext.mapKind, [ownerContext.mapKind]);

    return (
        <ListGroup className={styles.LiteArea}>
            <ListGroup.Item action onClick={()=>props.onSelect(DrawFeatureType.FreePolygon)}>
                <span className={styles.IconArea}>
                    <TbHexagon />
                </span>
                <span className={styles.LabelArea}>
                    自由作図（多角形）
                </span>
            </ListGroup.Item>
            {mapKind === MapKind.Virtual &&
                <ListGroup.Item action onClick={()=>props.onSelect(DrawFeatureType.FreeCircle)}>
                    <span className={styles.IconArea}>
                        <TbCircle />
                    </span>
                    <span className={styles.LabelArea}>
                        自由作図（円）
                    </span>
                </ListGroup.Item>
            }
            {mapKind === MapKind.Real &&
                <ListGroup.Item action onClick={()=>props.onSelect(DrawFeatureType.AddressArea)}>
                    <span className={styles.IconArea}>
                        <TbHexagon />
                    </span>
                    <span className={styles.LabelArea}>
                        エリア住所検索
                    </span>
                </ListGroup.Item>
            }
            {mapKind === MapKind.Real &&
                <ListGroup.Item action onClick={()=>props.onSelect(DrawFeatureType.AddressPointRadius)}>
                    <span className={styles.IconArea}>
                        <TbCircle />
                    </span>
                    <span className={styles.LabelArea}>
                        円エリア作図
                    </span>
                </ListGroup.Item>
            }
        </ListGroup>
    );
}