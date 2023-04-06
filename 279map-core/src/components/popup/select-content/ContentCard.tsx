import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { doCommand } from '../../../util/Commander';
import Card from '../../common/card/Card';

type Props = {
    contentId: string;
}

export default function ContentCard(props: Props) {
    const contentsList = useSelector((state: RootState) => state.data.contentsList);

    const content = useMemo(() => {
        return contentsList.find((item) => item.id === props.contentId);
    }, [contentsList, props.contentId]);

   const imageContentId = useMemo(() => {
        if (!content?.image) return undefined;
        return props.contentId;

    }, [props.contentId, content]);

    const breadcrumb = useMemo(() => {
        if (!content?.parentId) return undefined;
        const getAncestor = (parentId: string): string[] => {
            const parent = contentsList.find(c => c.id === parentId);
            if (!parent) return [];

            if (parent.parentId) {
                const ancestor = getAncestor(parent.parentId);
                ancestor.push(parent.title);
                return ancestor;
            } else {
                return [parent.title];
            }
        };
        return getAncestor(content.parentId);

    }, [content, contentsList]);

    const onClick = useCallback(() => {
        doCommand({
            command: 'ShowContentInfo',
            param: props.contentId,
        })
    }, [props.contentId]);

    if (!content) return null;
    return (
        <Card title={content.title} breadcrumb={breadcrumb} imageId={imageContentId} onClick={onClick} />
    );
}