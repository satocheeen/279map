import React, { useCallback, useId, useMemo } from 'react';
import Overlay from '../common/spinner/Overlay';
import { useAtom } from 'jotai';
import { processMessagesAtom } from '../common/spinner/useProcessMessage';
import { temporaryItemsAtom } from '../../store/item';
import { TfiTarget } from "react-icons/tfi";
import styles from './ProcessOverlay.module.scss';
import Tooltip from '../common/tooltip/Tooltip';
import useTemporaryItem from '../../store/item/useTemporaryItem';

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
export default function ProcessOverlay() {
    const [ processMessages ] = useAtom(processMessagesAtom);
    const [ temporaryItems ] = useAtom(temporaryItemsAtom);

    /**
     * 登録処理中アイテムがあるか
     */
    const isRegisting = useMemo(() => {
        return temporaryItems.some(temp => temp.status === 'registing');
    }, [temporaryItems]);

    /**
     * 登録処理失敗アイテム
     */
    const registingErrorItem = useMemo(() => {
        return temporaryItems.find(temp => temp.error);
    }, [temporaryItems])

    /**
     * オーバーレイ表示するかどうか
     */
    const isShowOverlay = useMemo(() => {
        return processMessages.some(pm => pm.overlay);
    }, [processMessages]);

    /**
     * スピナー表示するかどうか
     */
    const isShowSpinner = useMemo(() => {
        if (isRegisting) return true;
        return processMessages.some(pm => pm.spinner);
    }, [processMessages, isRegisting]);

    /**
     * 表示するメッセージ。メッセージが存在しない場合は、undefined。
     */
    const processMessage = useMemo(() => {
        if (isRegisting) {
            return '登録中...'
        }
        return processMessages.find(pm => pm.message)?.message;
    }, [processMessages, isRegisting]);
    
    if (registingErrorItem) {
        return (
            <Overlay minimum>
                <RegistingErrorComponent tempId={registingErrorItem.tempId} />
            </Overlay>

        )
    }
    return (
        <Overlay
            spinner={isShowSpinner}
            minimum={!isShowOverlay}
            message={processMessage}
        />
    )
}

/**
 * 登録処理に失敗したアイテムについて、
 * リトライするかどうかを選択させるためのコンポーネント
 */
type RegistingErrorComponentProps = {
    tempId: string; // 対象アイテム
}
function RegistingErrorComponent(props: RegistingErrorComponentProps) {
    const id = useId();
    const { continueProcess } = useTemporaryItem();

    const handleContinue = useCallback((retry: boolean) => {
        continueProcess(props.tempId, retry);
    }, [continueProcess, props.tempId]);

    return (
        <div className={styles.ErrorContainer}>
            <p>登録に失敗しました。</p>
            <button>
                <TfiTarget id={id} />
                <Tooltip anchorId={id} content='対象確認' place="bottom" />
            </button>

            <button onClick={()=>handleContinue(true)}>リトライ</button>
            <button onClick={()=>handleContinue(false)}>キャンセル</button>
        </div>
    )
}