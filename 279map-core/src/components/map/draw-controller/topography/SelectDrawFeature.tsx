import { MapKind } from '279map-common';
import React from 'react';
import ListGroup from '../../../common/list/ListGroup';
import { TbCircle, TbHexagon } from 'react-icons/tb';
import styles from './SelectDrawFeature.module.scss';
import { useRecoilValue } from 'recoil';
import { currentMapKindState } from '../../../../store/session/sessionAtom';

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
    const mapKind = useRecoilValue(currentMapKindState);

    return (
        <ListGroup className={styles.LiteArea}>
            <ListGroup.Item onClick={()=>props.onSelect(DrawFeatureType.FreePolygon)}>
                <span className={styles.IconArea}>
                    <TbHexagon />
                </span>
                <span className={styles.LabelArea}>
                    自由作図（多角形）
                </span>
            </ListGroup.Item>
            {mapKind === MapKind.Virtual &&
                <ListGroup.Item onClick={()=>props.onSelect(DrawFeatureType.FreeCircle)}>
                    <span className={styles.IconArea}>
                        <TbCircle />
                    </span>
                    <span className={styles.LabelArea}>
                        自由作図（円）
                    </span>
                </ListGroup.Item>
            }
            {mapKind === MapKind.Real &&
                <ListGroup.Item onClick={()=>props.onSelect(DrawFeatureType.AddressArea)}>
                    <span className={styles.IconArea}>
                        <TbHexagon />
                    </span>
                    <span className={styles.LabelArea}>
                        エリア住所検索
                    </span>
                </ListGroup.Item>
            }
            {mapKind === MapKind.Real &&
                <ListGroup.Item onClick={()=>props.onSelect(DrawFeatureType.AddressPointRadius)}>
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