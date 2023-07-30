import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { CategoryBadge } from '../../common';
import styles from './CategorySelector.module.scss';
import { useRecoilValue } from 'recoil';
import { categoryState } from '../../../store/category';

type Props = {
    selected: string[]; // 選択中のカテゴリname
    onChange: (selected: string[]) => void;
}

export default function CategorySelector(props: Props) {
    const [ isEditMode, setEditMode ] = useState(false);
    const categories = useRecoilValue(categoryState);
    const categoryNames = useMemo(() => categories.map(c => c.name), [categories]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [ inputValue, setInputValue ] = useState('');

    /**
     * 範囲外をクリックされた場合は、編集モードOff
     */
    useEffect(() => {
        const listener = () => {
            setEditMode(false);
        }
        window.addEventListener('click', listener);

        return () => {
            window.removeEventListener('click', listener);
        }
    }, []);

    const onSelectedAreaClick = useCallback((evt: React.MouseEvent) => {
        setEditMode((current) => {
            return !current;
        });
        // windowのクリックイベントを発火させない
        evt.stopPropagation();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setInputValue('');
            inputRef.current?.focus();
        }
    }, [isEditMode]);

    const onInputClick = useCallback((evt: React.MouseEvent) => {
        console.log('input');
        evt.stopPropagation();
    }, []);

    /**
     * 候補一覧に表示するカテゴリ
     */
    const candidateCategories = useMemo(() => {
        // 選択中のものを除去
        const extractSelected = categoryNames.filter(c => !props.selected.includes(c));
        if (inputValue.length === 0) {
            return extractSelected;
        }
        // 入力値でフィルタ
        const filtered = extractSelected.filter(c => c.indexOf(inputValue) !== -1);
        if (!filtered.includes(inputValue)) {
            // 完全一致するものがない場合は、新規用意
            return [...filtered, inputValue];
        } else {
            return filtered;
        }
    }, [categoryNames, props.selected, inputValue]);

    const onClick = useCallback((category: string) => {
        const newSelected = props.selected.concat(category);
        props.onChange(newSelected);
    }, [props]);

    /**
     * 選択中のカテゴリでDeleteボタンが押された場合
     */
    const onDeleteClick = useCallback((category: string) => {
        const newSelected = props.selected.filter(c => c !== category);
        props.onChange(newSelected);
    }, [props]);

    return (
        <div className={styles.Container}>
            <div className={`${styles.SelectedArea} ${isEditMode ? styles.Edit : ''}`} onClick={onSelectedAreaClick}>
                {props.selected.map(category => {
                    return (
                        <CategoryBadge category={category} existCategories={categories} key={category} onDeleteClick={() => onDeleteClick(category)} />
                    )
                })}
                { isEditMode &&
                    <input ref={inputRef} className={styles.InputArea} onClick={onInputClick} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                }
            </div>
            { isEditMode &&
                <div className={`form-control ${styles.CandidateList}`}>
                    {candidateCategories.map(category => {
                        return (
                            <CategoryBadge category={category} existCategories={categories} key={category} click={() => onClick(category)} />
                        )
                    })}
                </div>
            }
        </div>
    );
}