import React, { useCallback, useContext, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { NewContentInfoParam } from '../../util/Commander';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';

type Props = {
    target: {
        itemId: string;
    } | {
        contentId: string;
    };
    modal?: boolean;
}
export default function AddContentMenu(props: Props) {
    const { onNewContentInfo } = useContext(OwnerContext);
    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        if (!onNewContentInfo) return;

        const param: NewContentInfoParam = val === 'new'
        ? {
            parent: props.target,
            mode: 'manual',
        }
        : {
            parent: props.target,
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
        <PopupMenuIcon tooltip={caption} modal={props.modal} submenu={{
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