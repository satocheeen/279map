import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAPI } from '../../../api/useAPI';
import { RootState } from '../../../store/configureStore';
import { doCommand } from '../../../util/Commander';
import Card from '../../common/card/Card';

type Props = {
    contentId: string;
}

export default function ContentCard(props: Props) {
    const { apiUrl } = useAPI();
    const contentsList = useSelector((state: RootState) => state.data.contentsList);

    const content = useMemo(() => {
        return contentsList.find((item) => item.id === props.contentId);
    }, [contentsList, props.contentId]);

   const imageUrl = useMemo(() => {
        if (!content?.image) return undefined;
        return `${apiUrl}getthumb?id=${props.contentId}`;

    }, [apiUrl, props.contentId, content]);

    const onClick = useCallback(() => {
        doCommand({
            command: 'ShowContentInfo',
            param: props.contentId,
        })
    }, [props.contentId]);

    if (!content) return null;
    return (
        <Card title={content.title} imageUrl={imageUrl} onClick={onClick} />
    );
}