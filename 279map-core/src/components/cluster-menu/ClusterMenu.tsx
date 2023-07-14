import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import useIcon from '../../store/useIcon';
import { DataId } from '279map-common';
import { getMapKey } from '../../store/data/dataUtility';
import { useMap } from '../map/useMap';
import { BsImage } from 'react-icons/bs';

const ARROW_HEIGHT = 20;
const ARROW_OFFSET_LEFT = 45;

/**
 * Cluster items' menu for selecting an item.
 * 重畳選択メニュー
 */

type Props = {
    // the menu position
    position: Coordinate;

    // the menu items' ID. 
    itemIds: DataId[];

    onSelect?: (id: DataId) => void;
    onClose?: () => void;
}

export default function ClusterMenu(props: Props) {
    const { getMap } = useMap();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const map = getMap();
        if (!map) return;
        const overlay = new Overlay({
            positioning: 'bottom-left', //OverlayPositioning.BOTTOM_CENTER,
            offset: [-1 * ARROW_OFFSET_LEFT, 0],
            stopEvent: true,
            element: elementRef.current as HTMLDivElement,
            className: styles.ContainerWrapper,
        });
        map.addOverlay(overlay);
        overlay.setPosition(props.position);


        return () => {
            map.removeOverlay(overlay);
        }
    }, [getMap, props.position]);

    const style = useMemo(() => {
        const map = getMap();
        if (!map) return {};

        // 地図からはみ出ない高さにする
        const pixel = map.getPixelFromCoordinate(props.position);
        return {
            maxHeight: pixel[1] - ARROW_HEIGHT - 10,// - rect.y,
        }
    }, [getMap, props.position]);

    const onItemClick = useCallback((id: DataId) => {
        if (props.onSelect) {
            props.onSelect(id);
        }
    }, [props]);

    return (
        <div>
            <div ref={elementRef}>
                <div className={styles.Container} style={style}>
                    {props.itemIds.map(id => {
                        return (
                            <MenuItem key={getMapKey(id)} id={id} 
                                onClick={() => onItemClick(id)}
                                onClose={props.onClose} />
                        );
                    })}
                </div>
                <div className={styles.Triangle}></div>
            </div>
        </div>
    );
}

type MenuItemProp = {
    id: DataId;
    onClick?: () => void;
    onClose?: () => void;
}
function MenuItem(props: MenuItemProp) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const item = useMemo(() => itemMap[getMapKey(props.id)], [props.id, itemMap]);

    const { getIconDefine } = useIcon();

    const iconDefine = useMemo(() => {
        if (!item.geoProperties) {
            return getIconDefine();
        }
        if (!('icon' in item.geoProperties)) {
            // TODO: 空を設定
            return getIconDefine();
        }
        return getIconDefine(item.geoProperties.icon);

    }, [getIconDefine, item]);

    const hasImage = useMemo(() => {
        return item.contents.some(c => c.hasImage);
    }, [item]);

    const itemName = useMemo(() => {
        if (!item) return ''
        return item.name;
    }, [item]);

    return (
        <li className={styles.MenuItem} onClick={props.onClick}>
            {iconDefine.type === 'system' ?
                <img src={iconDefine.imagePath} />
                :
                <img src={iconDefine.imagePath} alt={'icon' + iconDefine.caption} />
            }
            <span className={styles.NameArea}>
                <span>{itemName}</span>
                {hasImage &&
                    <span className={styles.Icon}><BsImage /></span>
                }
            </span>
        </li>
    );
}
