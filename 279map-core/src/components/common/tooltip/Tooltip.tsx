import React, { useContext, useEffect, useRef, useCallback, useState } from 'react';
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import styles from './Tooltip.module.scss';

type Props = {
    anchorId: string;
    content?: string;
    place: 'top' | 'right' | 'left' | 'bottom';
    events?: ('hover' | 'click')[];
    className?: string;
    isOpen?: boolean;
    children?: JSX.Element;

    // nameを指定している場合は、同一nameのTooltipは１つだけ表示するように制御
    name?: string;
    onHide?: () => void;
}

// TooltipContextで囲まれている範囲は、同時に１つのTooltipのみ表示される
export type TooltipContextValue = {
    showIdMap: {[name: string]: string};
    setShowIdMap: (val: {[name: string]: string}) => void;
}
export const TooltipContext = React.createContext<TooltipContextValue>({
    showIdMap: {},
    setShowIdMap: () => {},
});
let maxId = 0;
export default function Tooltip(props: Props) {
    const id = useRef('tooltip' + maxId++);
    const { showIdMap, setShowIdMap } = useContext(TooltipContext);
    const [ isOpen, setIsOpen ] = useState(false);

    const onChangeOpen = useCallback((open: boolean) => {
        // console.log('onChangeOpen', props.name, id.current, open, showIdMap);
        if (props.isOpen === false) {
            return;
        }
        if (!props.name) {
            setIsOpen(open);
            return;
        }
        if(open){
            if (showIdMap[props.name] !== id.current) {
                const newState = Object.assign({}, showIdMap);
                newState[props.name] = id.current;
                // console.log('newState', newState);
                setShowIdMap(newState);
            }
        }
    }, [props.name, props.isOpen, showIdMap, setShowIdMap]);

    useEffect(() => {
        // console.log('isOpen changed', props.name, isOpen);
        if (isOpen || !props.onHide) return;

        if (props.name && showIdMap[props.name] === id.current) {
            const newState = Object.assign({}, showIdMap);
            delete newState[props.name];
            setShowIdMap(newState);
        }
        props.onHide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (props.isOpen !== undefined) {
            onChangeOpen(props.isOpen);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isOpen]);

    useEffect(() => {
        if (!props.name) return;
        if (props.isOpen === false) {
            setIsOpen(false);
        } else {
            setIsOpen(showIdMap[props.name] === id.current);
        }
    }, [showIdMap, props.isOpen, props.name]);

    return (
        <ReactTooltip anchorId={props.anchorId}
            content={props.content}
            place={props.place} events={props.events}
            isOpen={isOpen}
            setIsOpen={onChangeOpen}
            className={`${styles.Tooltip} ${props.className ? props.className : ''}`}
            >
            {props.children}
        </ReactTooltip>
    );
}