import React, { useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useWatch } from '../../../util/useWatch2';
import ListGroup from '../../common/list/ListGroup';
import styles from './AddableContentsListPage.module.scss';
import { atomWithQuery } from 'jotai-urql';
import { ContentsDatasource, GetLinkableContentsDatasourcesDocument } from '../../../graphql/generated/graphql';
import { loadable } from 'jotai/utils';

type Props = {
    // 追加対象として✔されたコンテンツ一覧
    onChange?: (items: ContentsDatasource[]) => void;
}

export type GetLink = {
    datasourceId: string;
    name: string;
}
type AddableContentItem = ContentsDatasource & {
    checked?: boolean;
}
const queryAtom = atomWithQuery({
    query: GetLinkableContentsDatasourcesDocument,
    getContext() {
        return {
            requestPolicy: 'network-only',
        }
    },
});
const queryLoadableAtom = loadable(queryAtom);

export default function AddableContentsListPage(props: Props) {
    const [ list, setList ] = useState<AddableContentItem[]>([]);
    const [, setModalSpinner] = useAtom(modalSpinnerAtom);
    const [ loadable ] = useAtom(queryLoadableAtom);

    useEffect(() => {
        if (loadable.state === 'loading') {
            setModalSpinner(true);
            return;
        }
        setModalSpinner(false);
        if (loadable.state === 'hasError') {
            setList([]);
            return;
        }
        const newList = loadable.data.data?.getLinkableContentsDatasources ?? [];
        setList(newList);

    }, [loadable, setModalSpinner])

    useWatch(list, 
        useCallback((oldVal, newVal) => {
            if (!props.onChange) return;
            // チェックされたものに絞る
            const targets = newVal.filter(item => item.checked);
            props.onChange(targets);
        }, [props])
    )

    const handleChecked = useCallback((index: number, val: boolean) => {
        setList(cur => {
            const newList = structuredClone(cur);
            newList[index].checked = val;
            return newList;
        });
    }, [])

    const handleItemClicked = useCallback((index: number) => {
        const newVal = !list[index].checked;
        handleChecked(index, newVal);
    }, [list, handleChecked]);

    return (
        <div className={styles.TableContainer}>
            <ListGroup>
                {list.map((ds, index) => {
                    return (
                        <ListGroup.Item key={ds.datasourceId} onClick={() => handleItemClicked(index)}>
                            <div className={styles.Item}>
                                <span>
                                    <input type='checkbox' checked={ds.checked ?? false} onChange={(evt) => handleChecked(index, evt.target.checked)} />
                                </span>
                                <span>
                                    {ds.name}
                                </span>
                            </div>
                        </ListGroup.Item>
                    )
                })}
            </ListGroup>
        </div>
    );
}