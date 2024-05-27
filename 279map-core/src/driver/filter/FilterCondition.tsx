import React, { useState, useMemo, useCallback, useRef, useContext } from 'react';
import styles from './FilterCondition.module.scss';
import { useWatch } from '../../util/useWatch2';
import { DriverContext } from '../TestMap';
import { Condition } from './FilterTest';

type FilterKind = keyof Required<Condition>;
const filterKinds: FilterKind[] = ['category', 'date', 'keyword'];

type Props = {
    onChange: (filter: Condition | undefined) => void;
}

export default function FilterCondition(props: Props) {
    const { categories } = useContext(DriverContext);
    const [ currentMode, setCurrentMode ] = useState<FilterKind>('category');
    const [ category, setCategory ] = useState<string| undefined>();
    const onChangeCategory = useCallback((category: string | undefined) => {
        setCategory(category);
    }, []);

    const [ date, setDate ] = useState<string>('');
    const [ keyword, setKeyword ] = useState<string>('');
    const filter = useMemo((): Condition | undefined => {
        if ([category, date, keyword].every(val => !val)) {
            return undefined;
        }
        const filter: Condition = {
            category: category ? [category] : undefined,
            date: date ? [date] : undefined,
            keyword: keyword ? [keyword] : undefined
        };
        return filter;

    }, [category, date, keyword]);

    useWatch(filter, () => {
        props.onChange(filter);
    });
    
    const categoryFilter = useMemo(() => {
        return (
            <div className={styles.ListArea}>
                <label>
                    なし
                    <input type="radio" checked={category===undefined} onChange={() => onChangeCategory(undefined)} />
                </label>
                {categories.map(c => {
                    return (
                        <label key={c.name}>
                            {c.name}
                            <input type="radio" checked={category===c.name} onChange={() => onChangeCategory(c.name)} />
                        </label>
                    )
                })}
            </div>
        )
    }, [categories, category, onChangeCategory]);

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
                    {filterKinds.map(name => {
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
                    <div className={`${currentMode==='date' ? styles.Active : ''}`}>
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
    name: FilterKind;
    active?: boolean;
    onClick?: () => void;
}
function Tab(props: TabProps) {
    const label = useMemo(() => {
        switch(props.name) {
            case 'category':
                return 'カテゴリ';
            case 'date':
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