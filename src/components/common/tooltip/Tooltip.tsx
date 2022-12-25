import React, { useContext, useEffect, useMemo, useCallback } from 'react';
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip as ReactTooltip, TooltipWrapper } from 'react-tooltip'
import styles from './Tooltip.module.scss';

type Props = {
    anchorId: string;
    content?: string;
    place: 'top' | 'right' | 'left' | 'bottom';
    events?: ('hover' | 'click')[];
    className?: string;
    isOpen?: boolean;
    children?: JSX.Element;
}

// TooltipContextで囲まれている範囲は、同時に１つのTooltipのみ表示される
export type TooltipContextValue = {
    enable: boolean;
    showId: string | undefined;
    setShowId: (id: string) => void;
}
export const TooltipContext = React.createContext<TooltipContextValue>({
    enable: false,
    showId: undefined,
    setShowId: () => {},
});
export default function Tooltip(props: Props) {
    const { enable, showId } = useContext(TooltipContext);

    const isOpen = useMemo(() => {
        if (!enable) {
            if (props.isOpen !== undefined) {
                return props.isOpen;
            } else {
                return undefined;
            }
        }
        if (props.isOpen === false) {
            return false;
        }
        return showId === props.anchorId;
    }, [enable, showId, props.anchorId, props.isOpen]);

    const onChangeOpen = useCallback((open: boolean) => {
        console.log('onChangeOpen', props.content, open);
        return open;
    }, [props.content]);

    useEffect(() => {
        console.log('content', props.content, 'isOpen', isOpen)
    }, [isOpen, props.content]);

    return (
        <ReactTooltip anchorId={props.anchorId}
            content={props.content}
            place={props.place} events={props.events}
            className={`${styles.Tooltip} ${props.className ? props.className : ''}`}
            >
            {props.children}
        </ReactTooltip>
    );
}