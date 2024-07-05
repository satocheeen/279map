import React, { useState, useMemo, useCallback, useRef, useContext } from 'react';
import styles from './FilterCondition.module.scss';
import { useWatch } from '../../util/useWatch2';
import { DriverContext } from '../TestMap';
import { Condition } from './FilterTest';
import { CategoryCondition } from '../../graphql/generated/graphql';
import { CategoryBadge } from '../../components';

type FilterKind = keyof Required<Condition>;
const filterKinds: FilterKind[] = ['category', 'date', 'keyword'];

type Props = {
    onChange: (filter: Condition | undefined) => void;
}

export default function FilterCondition(props: Props) {
    const { categories, contentDatasources } = useContext(DriverContext);
    const [ currentMode, setCurrentMode ] = useState<FilterKind>('category');
    const [ category, setCategory ] = useState<CategoryCondition| undefined>();
    const onChangeCategory = useCallback((category: CategoryCondition | undefined) => {
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
                    const contentDef = contentDatasources.find(cd => cd.datasourceId === c.datasourceId);
                    const fieldDef = contentDef?.config.fields.find(field => field.key === c.fieldKey);
                    const label = contentDef?.name + ' - ' + fieldDef?.label;
                    return (
                        <div key={c.datasourceId + '-' + c.fieldKey}>
                            <div className={styles.CategoryFieldLabel}>{label}</div>
                            {c.categories.map(c2 => {
                                return (
                                    <CategoryBadge key={c2.value}
                                        category={c2.value}
                                        existCategories={c.categories}
                                        outline={category?.datasourceId=== c.datasourceId && category.fieldKey === c.fieldKey && category.value === c2.value}
                                        click={() => onChangeCategory({
                                            datasourceId: c.datasourceId,
                                            fieldKey: c.fieldKey,
                                            value: c2.value,
                                        })}
                                    />
                                    // <label key={c2.value} style={{backgroundColor: c2.color}}>
                                    //     {c2.value}
                                    //     <input type="radio"
                                    //         checked={category?.datasourceId=== c.datasourceId && category.fieldKey === c.fieldKey && category.value === c2.value}
                                    //         onChange={() => onChangeCategory({
                                    //             datasourceId: c.datasourceId,
                                    //             fieldKey: c.fieldKey,
                                    //             value: c2.value,
                                    //         })} />
                                    // </label>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        )
    }, [categories, category, onChangeCategory, contentDatasources]);

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