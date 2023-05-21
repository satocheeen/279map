import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { doCommand } from '../../../util/Commander';
import Card from '../../common/card/Card';
import { ContentsDefine, DataId } from '279map-common';
import { isEqualId } from '../../../store/data/dataUtility';
import dayjs from 'dayjs';

type Props = {
    content: ContentsDefine;
}

export default function ContentCard(props: Props) {
    const contentsList = useSelector((state: RootState) => state.data.contentsList);

   const imageContentId = useMemo(() => {
        if (!props.content?.image) return undefined;
        return props.content.id;

    }, [props.content]);

    const breadcrumb = useMemo(() => {
        if (!props.content?.parentId) return undefined;
        const getAncestor = (parentId: DataId): string[] => {
            const parent = contentsList.find(c => isEqualId(c.id, parentId));
            if (!parent) return [];

            if (parent.parentId) {
                const ancestor = getAncestor(parent.parentId);
                ancestor.push(parent.title);
                return ancestor;
            } else {
                return [parent.title];
            }
        };
        return getAncestor(props.content.parentId);

    }, [props.content, contentsList]);

    const overview = useMemo(() => {
        if(!props.content?.date) return undefined;
        return dayjs(props.content.date).format('YYYY/MM/DD HH:mm');
    }, [props.content]);

    const onClick = useCallback(() => {
        doCommand({
            command: 'ShowContentInfo',
            param: props.content.id,
        })
    }, [props.content]);

    return (
        <Card title={props.content.title} breadcrumb={breadcrumb} overview={overview}
         imageId={imageContentId} onClick={onClick} />
    );
}