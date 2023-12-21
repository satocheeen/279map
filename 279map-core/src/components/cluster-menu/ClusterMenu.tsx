import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import styles from './ClusterMenu.module.scss';
import useIcon from '../../store/icon/useIcon';
import { DataId } from '279map-common';
import { getMapKey } from '../../util/dataUtility';
import { useMap } from '../map/useMap';
import { BsImage } from 'react-icons/bs';
import { useItem } from '../../store/item/useItem';
import { itemDataSourcesAtom } from '../../store/datasource';
import { useAtom } from 'jotai';

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
    const { map } = useMap();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
    }, [map, props.position]);

    const style = useMemo(() => {
        if (!map) return {};

        // 地図からはみ出ない高さにする
        const pixel = map.getPixelFromCoordinate(props.position);
        return {
            maxHeight: pixel[1] - ARROW_HEIGHT - 10,// - rect.y,
        }
    }, [map, props.position]);

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
    const { item } = useItem({ id: props.id });

    const { getIconDefine } = useIcon();

    const [ dataSources ] = useAtom(itemDataSourcesAtom);
    const iconDefine = useMemo(() => {
        if (!item?.geoProperties) {
            return getIconDefine();
        }
        if (!('icon' in item.geoProperties)) {
            // icon未指定の場合はレイヤデフォルトアイコンを設定
            const datasource = dataSources.find(ds => ds.datasourceId === item.id.dataSourceId);
            const icon = datasource?.config.__typename === 'RealPointContentConfig' ? datasource.config.defaultIcon : undefined;
            return getIconDefine(icon);
        }
        return getIconDefine(item.geoProperties.icon);

    }, [getIconDefine, item, dataSources]);

    const hasImage = useMemo(() => {
        return item?.hasImageContentId.length > 0;
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
