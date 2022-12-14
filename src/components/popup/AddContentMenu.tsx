import React, { useCallback, useMemo } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { doCommand } from '../../util/Commander';
import PopupMenuIcon from './PopupMenuIcon';

type Props = {
    itemId: string;
} | {
    contentId: string;
}

export default function AddContentMenu(props: Props) {
    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        switch(val) {
            case 'new':
                doCommand({
                    command: "NewContentInfo",
                    param: {
                        parent: props,
                        mode: 'manual',
                    },
                });
                break;
            case 'unpoint':
                doCommand({
                    command: "NewContentInfo",
                    param: {
                        parent: props,
                        mode: 'select-unpoint',
                    },
                });
        }

    }, [props]);

    const caption = useMemo(() => {
        if ('itemId' in props) {
            return 'コンテンツ追加';
        } else {
            return '子コンテンツ追加';
        }
    }, [props]);

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