import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';
import styles from './Toggle.module.scss';

type Props<T> = {
    onToggle?: (value: T) => void;
    children: [ToggleItem, ToggleItem];
    className?: string;
    value?: T;
    transparent?: boolean;  // trueの場合、透過スタイル
}

export default function Toggle<T>(props: Props<T>) {
    const [enableIndex, setEnableIndex] = useState(0);
    const [hoverIndex, setHoverIndex] = useState<number>();

    useEffect(() => {
        if (!props.value) {
            return;
        }
        const index = props.children.findIndex(child => {
            return (child.props as ItemProps<T>).value === props.value;
        });
        if (enableIndex !== index) {
            setEnableIndex(index);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value]);

    const onClick = useCallback((index: number) => {
        if (index === enableIndex) return;
        setEnableIndex(index);
        if (props.onToggle) {
            const value = (props.children[index].props as ItemProps<T>).value;
            props.onToggle(value);
        }
    }, [props, enableIndex]);

    const onHoverIn = useCallback((index: number) => {
        setHoverIndex(index);
    }, []);
    const onHoverOut = useCallback((index: number) => {
        if (hoverIndex === index) {
            setHoverIndex(undefined);
        }
    }, [hoverIndex]);

    return (
        <div className={`${styles.Container} ${props.transparent ? styles.Transparent : ''} ${props.className} ${(hoverIndex !== undefined && hoverIndex!==enableIndex) ? styles.Hover : ''}`}>
            {props.children.map((child, index) => {
                return (
                    <ToggleButton key={index} 
                        onClick={()=>onClick(index)} index={index} isOn={index===enableIndex}
                        onHoverIn={()=>onHoverIn(index)} onHoverOut={()=>onHoverOut(index)}>
                        {child}
                    </ToggleButton>
                )
            })}
            <div className={`${styles.Button} ${enableIndex === 0 ? styles.Left : styles.Right} ${hoverIndex === enableIndex ? styles.Hover : ''}`} />
        </div>
    );
}
type ButtonProps = {
    children: ToggleItem;
    onClick: () => void;
    isOn: boolean;
    index: number;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
}
function ToggleButton(props: ButtonProps) {
    const className = useMemo(() => {
        return (props.index === 0 ? styles.Left : styles.Right) + ' ' + (props.isOn ? styles.On : styles.Off);
    }, [props]);

    return (
        <div onClick={props.onClick} className={`${styles.Label} ${className}`} onMouseEnter={props.onHoverIn} onMouseLeave={props.onHoverOut}>
            {props.children}
        </div>
    )
}

type ItemProps<T> = {
    value: T;
    caption: string;
    icon: JSX.Element;
}
export function ToggleItemComponent<T>(props: ItemProps<T>) {
    return (
        <>
            <span>
                {props.icon}
            </span>
            <span>
                {props.caption}
            </span>
        </>
    );
}
type ToggleItem = ReturnType<typeof ToggleItemComponent>