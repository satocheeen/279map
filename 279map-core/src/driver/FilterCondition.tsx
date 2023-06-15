import React, { useState, useMemo, useCallback, useRef } from 'react';
import { CategoryDefine, FilterDefine } from '../entry';
import styles from './FilterCondition.module.scss';
import { useWatch } from '../util/useWatch';

type Props = {
    categories: CategoryDefine[];
    onChange: (filter: FilterDefine[] | undefined) => void;
}

export default function FilterCondition(props: Props) {
    const [ currentMode, setCurrentMode ] = useState<FilterDefine['type']>('category');
    const [ category, setCategory ] = useState<string| undefined>();
    const onChangeCategory = useCallback((category: string | undefined) => {
        setCategory(category);
    }, []);

    const [ date, setDate ] = useState<string>('');
    const [ keyword, setKeyword ] = useState<string>('');
    const filter = useMemo((): FilterDefine[] | undefined => {
        const filter = [] as FilterDefine[];
        if (category) {
            filter.push(
                {
                    type: 'category',
                    category,
                }
            );
        }
        if (date.length > 0) {
            filter.push(
                {
                    type: 'calendar',
                    date,
                }
            )
        }
        if (keyword.length > 0) {
            filter.push(
                {
                    type: 'keyword',
                    keyword,
                }
            )

        }
        if (filter.length === 0) {
            return undefined;
        }
        return filter;

    }, [category, date, keyword]);

    useWatch(() => {
        props.onChange(filter);
    }, [filter]);
    
    const categoryFilter = useMemo(() => {
        return (
            <div className={styles.ListArea}>
                <label>
                    なし
                    <input type="radio" checked={category===undefined} onChange={() => onChangeCategory(undefined)} />
                </label>
                {props.categories.map(c => {
                    return (
                        <label key={c.name}>
                            {c.name}
                            <input type="radio" checked={category===c.name} onChange={() => onChangeCategory(c.name)} />
                        </label>
                    )
                })}
            </div>
        )
    }, [props.categories, category, onChangeCategory]);

    const calendarFilter = useMemo(() => {
        return (
            <input type="date" value={date} onChange={(evt) => setDate(evt.target.value)} />
        )
    }, [date]);

    const keywordRef = useRef<HTMLInputElement>(null);
    const keywordFilter = useMemo(() => {
        return (
            <>
                <input ref={keywordRef} type="text" />
                <button onClick={() => setKeyword(keywordRef.current?.value ?? '')}>検索</button>
            </>
        )
    }, []);

    const onClear = useCallback(() => {
        setCategory(undefined);
        setDate('');
        setKeyword('');
    }, []);

    return (
        <>
            <div className={styles.Container}>
                <div className={styles.TabArea}>
                    {(['category', 'calendar', 'keyword'] as FilterDefine['type'][]).map(name => {
                    <Tab name='category' />
                        return (
                            <Tab key={name} name={name} active={currentMode===name}
                                onClick={() => setCurrentMode(name)} />
                        )
                    })}
                </div>
                <div className={styles.BodyArea}>
                    <div className={`${currentMode==='category' ? styles.Active : ''}`}>
                        {categoryFilter}
                    </div>
                    <div className={`${currentMode==='calendar' ? styles.Active : ''}`}>
                        {calendarFilter}
                    </div>
                    <div className={`${currentMode==='keyword' ? styles.Active : ''}`}>
                        {keywordFilter}
                    </div>
                </div>
            </div>
            <div>
                <button onClick={onClear}>Clear</button>
            </div>
        </>
    );
}

type TabProps = {
    name: FilterDefine['type'];
    active?: boolean;
    onClick?: () => void;
}
function Tab(props: TabProps) {
    const label = useMemo(() => {
        switch(props.name) {
            case 'category':
                return 'カテゴリ';
            case 'calendar':
                return 'カレンダー';
            case 'keyword':
                return 'キーワード';
        }
    }, [props.name]);

    const click = useCallback(() => {
        if (props.onClick) {
            props.onClick();
        }
    }, [props]);

    return (
        <div className={`${styles.Tab} ${props.active ? styles.Active : ''}`}
            onClick={click}>
            {label}
        </div>
    )

}