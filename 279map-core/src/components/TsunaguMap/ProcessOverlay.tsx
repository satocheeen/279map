import React, { useCallback, useMemo } from 'react';
import Overlay from '../common/spinner/Overlay';
import { useAtom } from 'jotai';
import { processMessagesAtom } from '../common/spinner/useProcessMessage';
import { ItemProcessType, itemProcessesAtom } from '../../store/item';
import styles from './ProcessOverlay.module.scss';
import useItemProcess from '../../store/item/useItemProcess';

/**
 * 地図の上にスピナーやメッセージをオーバーレイ表示するためのコンポーネント
 */
export default function ProcessOverlay() {
    const [ processMessages ] = useAtom(processMessagesAtom);
    const [ itemProcesses ] = useAtom(itemProcessesAtom);

    /**
     * 処理失敗プロセス
     */
    const errorProcesses = useMemo(() => {
        return itemProcesses.filter(temp => temp.error);
    }, [itemProcesses])

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
        if (itemProcesses.length > 0) return true;
        return processMessages.some(pm => pm.spinner);
    }, [processMessages, itemProcesses]);

    /**
     * 表示するメッセージ。メッセージが存在しない場合は、undefined。
     */
    const processMessage = useMemo(() => {
        if (itemProcesses.some(temp => temp.status === 'registing')) {
            return '登録中...';
        }
        if (itemProcesses.some(temp => temp.status === 'updating')) {
            return '更新中...';
        }
        return processMessages.find(pm => pm.message)?.message;
    }, [processMessages, itemProcesses]);
    
    if (errorProcesses.length > 0) {
        return (
            <Overlay minimum>
                <>
                {errorProcesses.map(errorProcess => (
                    <RegistingErrorComponent key={errorProcess.processId} process={errorProcess} />
                ))}
                </>
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
    process: ItemProcessType; // 対象プロセス
}
function RegistingErrorComponent(props: RegistingErrorComponentProps) {
    const { continueProcess } = useItemProcess();

    const handleContinue = useCallback((retry: boolean) => {
        continueProcess(props.process.processId, retry);
    }, [continueProcess, props.process]);

    const processName = useMemo(() => {
        switch(props.process.status) {
            case 'registing':
                return '登録';
            case 'updating':
                return '更新';
        }
    }, [props.process]);

    return (
        <div className={styles.ErrorContainer}>
            <p>{processName}に失敗しました。</p>
            <button onClick={()=>handleContinue(true)}>リトライ</button>
            <button onClick={()=>handleContinue(false)}>キャンセル</button>
        </div>
    )
}