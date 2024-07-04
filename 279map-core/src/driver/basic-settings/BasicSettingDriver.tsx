import React, { useCallback, useContext, useState } from 'react';
import styles from '../TestMap.module.scss';
import { TsunaguMapProps } from '../../entry';
import { DriverContext } from '../TestMap';

type Props = {
}

const defaultPopupMode: TsunaguMapProps['popupMode'] = 'maximum';

export default function BasicSettingDriver(props: Props) {
    const { setPopupMode, setDisableLabel } = useContext(DriverContext);

    return (
        <div className={styles.Col}>
            <PropRadio name='Popup'
                items={[{ label: 'hidden', value: 'hidden' }, {label: 'minimum', value: 'minimum' }, { label: 'maximum', value: 'maximum' }]}
                default={defaultPopupMode}
                onChange={setPopupMode} />
            <PropRadio name='Label'
                items={[{ label: 'enabled', value: true }, { label: 'disabled', value: false }]}
                onChange={setDisableLabel} />
            <span style={{fontSize:'small'}}>※地図オプションの指定がある場合はそちらが優先</span>
        </div>
    );
}

type PropRadioProps<T> = {
    name: string;
    onChange: (val: T) => void;
    items: {
        label: string;
        value: T;
    }[];
    default?: T;
    direction?: 'horizontal' | 'vertical';
}
export function PropRadio<T>(props: PropRadioProps<T>) {
    const [ value, setValue ] = useState<T>(props.default ?? props.items[0].value);
    const onChange = useCallback((val: T) => {
        setValue(val);
        props.onChange(val);
    }, [props]);

    return (
        <div className={styles.Row} style={props.direction ? {flexDirection: 'column'} : {}}>
            <span className={styles.PropName}>{props.name}</span>
            {props.items.map((item, index) => {
                return (
                    <label key={index}>
                        <input type="radio" checked={item.value === value} onChange={() => onChange(item.value)} />
                        {item.label}
                    </label>
                );
            })}
        </div>
    )
}
