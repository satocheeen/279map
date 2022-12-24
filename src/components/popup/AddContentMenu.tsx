import React, { useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { NewContentInfoParam } from '../../util/Commander';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';

type Props = {
    itemId: string;
} | {
    contentId: string;
}

export default function AddContentMenu(props: Props) {
    const { onNewContentInfo } = useContext(OwnerContext);
    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        if (!onNewContentInfo) return;

        const param: NewContentInfoParam = val === 'new'
        ? {
            parent: props,
            mode: 'manual',
        }
        : {
            parent: props,
            mode: 'select-unpoint',
        };
        onNewContentInfo(param);

    }, [props, onNewContentInfo]);

    const caption = useMemo(() => {
        if ('itemId' in props) {
            return 'コンテンツ追加';
        } else {
            return '子コンテンツ追加';
        }
    }, [props]);

    if (!onNewContentInfo) return null;

    return (
        <PopupMenuIcon tooltip={caption} submenu={{
            items: [
                { text: '新規作成', value: 'new' },
                { text: '既存コンテンツ', value: 'unpoint' },
            ],
            onClick: onAddContent,
        }}>
            <MdOutlineLibraryAdd />
        </PopupMenuIcon>
    );
}