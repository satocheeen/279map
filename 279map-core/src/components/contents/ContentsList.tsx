import React, { useCallback, useMemo } from 'react';
import { ContentsDefine } from '../../entry';
import { mapDefineAtom } from '../../store/session';
import { useAtom } from 'jotai';
import { SortCondition } from '../../graphql/generated/graphql';
import dayjs from 'dayjs';
import { filteredContentIdListAtom } from '../../store/filter';
import { getMapKey, isEqualId } from '../../util/dataUtility';
import Content from './Content';
import HideContents from './HideContents';

type Props = {
    contents: ContentsDefine[];
    allshow: boolean;   // フィルタヒット有無にかかわらず全コンテンツを表示する場合、true（アイテムがフィルタヒットしている場合は全コンテンツを表示状態にするために用意）
}

export default function ContentsList(props: Props) {
    const [ mapDefine ] = useAtom(mapDefineAtom);
    const comparater = useCallback((a: ContentsDefine, b: ContentsDefine) => {
        const sortCondition = mapDefine.options.contentsSortCondition ?? SortCondition.CreatedAtAsc;
        // TODO: 現状、コンテンツが作成日時、更新日時を持っていないので、それらのソート処理については未対応。
        //       後日、backend側の対応が完了してから、そちらについては実装する
        switch(sortCondition) {
            case SortCondition.DateAsc:
            case SortCondition.DateDesc:
                {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    const aVal = dayjs(a.date).valueOf();
                    const bVal = dayjs(b.date).valueOf();
                    return (sortCondition === SortCondition.DateAsc ? 1 : -1) * (aVal - bVal)
                }
        }
        return 0;
    }, [mapDefine.options]);

    const [ filteredContentIdList ] = useAtom(filteredContentIdListAtom);
    // 初期状態で表示対象のコンテンツ
    const showContents = useMemo((): ContentsDefine[] => {
        // フィルタ時は、フィルタされているものにしぼる
        const targets = (!filteredContentIdList || props.allshow) ? props.contents : props.contents.filter(content => {
            return filteredContentIdList.some(target => isEqualId(target, content.id));
        });
        const list = targets.sort(comparater)
        return list;
    }, [props.contents, filteredContentIdList, comparater, props.allshow])

    // 初期状態で非表示のコンテンツ（フィルタ対象外のもの）
    const hideContents = useMemo((): ContentsDefine[] => {
        if (!filteredContentIdList || props.allshow) return [];
        const targets = props.contents.filter(content => {
            return !filteredContentIdList.some(target => isEqualId(target, content.id));
        });
        return targets.sort(comparater)
    }, [props.contents, filteredContentIdList, comparater, props.allshow]);


    return (
        <>
        {
            showContents.map((content) => {
                return (
                    <Content key={getMapKey(content.id)} itemId={content.itemId}  content={content} childContentsAllshow={props.allshow} />
                )
            })
        }
        {
            hideContents.length > 0 &&
            <HideContents contents={hideContents} childContentsAllshow={props.allshow} />
        }
    </>
);
}