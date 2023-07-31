import React, { useCallback, useState, useContext, useMemo } from 'react';
import { OwnerContext } from './TsunaguMap';
import { useWatch } from '../../util/useWatch';
import { useRecoilValueLoadable, useSetRecoilState } from 'recoil';
import { connectStatusState, instanceIdState, mapDefineState, mapIdState, mapServerState } from '../../store/session';
import { createAPICallerInstance } from '../../api/ApiCaller';
import { ApiException } from '../../api';
import { ApiError, ErrorType, RequestAPI } from 'tsunagumap-api';
import Overlay from '../common/spinner/Overlay';
import { useMap } from '../map/useMap';
import { Button } from '../common';
import Input from '../common/form/Input';
import styles from './MapConnector.module.scss';

type Props = {
    children: React.ReactNode | React.ReactNode[];
}

/**
 * 地図サーバとのセッションを確立する。
 * OwnerContextで設定された値のうち、必要なものをRecoilに設定する。
 * @param props 
 * @returns 
 */
export default function MapConnector(props: Props) {
    const ownerContext = useContext(OwnerContext);
    const setInstanceId = useSetRecoilState(instanceIdState);
    const setMapId = useSetRecoilState(mapIdState);
    const setMapServer = useSetRecoilState(mapServerState);
    const connectLoadable = useRecoilValueLoadable(connectStatusState);
    const mapDefineLoadable = useRecoilValueLoadable(mapDefineState);

    useWatch(() => {
        console.log('setInstanceId', ownerContext.mapInstanceId);
        setInstanceId(ownerContext.mapInstanceId);
    }, [ownerContext.mapInstanceId]);

    useWatch(() => {
        console.log('setMapServer', ownerContext.mapInstanceId, ownerContext.mapServer);
        // API Accessor用意
        createAPICallerInstance(ownerContext.mapInstanceId, ownerContext.mapServer, (error) => {
            // コネクションエラー時(リロードが必要なエラー)
            console.warn('connection error', error);
        });

        setMapServer(ownerContext.mapServer);
    }, [ownerContext.mapServer]);

    useWatch(() => {
        setMapId(ownerContext.mapId);
    }, [ownerContext.mapId]);

    const loadableState = useMemo(() => {
        if (connectLoadable.state !== 'hasValue') {
            return connectLoadable.state;
        }
        return mapDefineLoadable.state;

    }, [connectLoadable, mapDefineLoadable]);

    switch (loadableState) {
        case 'hasValue':
            return (
                <>
                    {props.children}
                </>
            );
        case 'loading':
            return <Overlay spinner message='ロード中...' />

        case 'hasError':
            const e = connectLoadable.contents;
            const error: ApiError = (e instanceof ApiException) ? e.apiError
                                : {type: ErrorType.IllegalError, detail: e + ''};

            const errorMessage = function(): string {
                switch(error.type) {
                    case ErrorType.UndefinedMap:
                        return '指定の地図は存在しません';
                    case ErrorType.Unauthorized:
                        return 'この地図を表示するには、ログインが必要です';
                    case ErrorType.Forbidden:
                        return '認証期限が切れている可能性があります。再ログインを試してください。問題が解決しない場合は、管理者へ問い合わせてください。';
                    case ErrorType.NoAuthenticate:
                        return 'この地図に入るには管理者の承認が必要です';
                    case ErrorType.Requesting:
                        return '管理者からの承認待ちです';
                    case ErrorType.SessionTimeout:
                        return 'しばらく操作されなかったため、セッション接続が切れました。再ロードしてください。';
                    default:
                        return '想定外の問題が発生しました。再ロードしても問題が解決しない場合は、管理者へ問い合わせてください。';
                }
            }();
            const detail = error.detail ? `\n${error.detail}` : '';
            return (
                <Overlay message={errorMessage + detail}>
                    {error.type === ErrorType.NoAuthenticate &&
                        <RequestComponet />
                    }
                </Overlay>
            );
    }
}

/**
 * 登録申請コンポーネント
 * @returns 
 */
function RequestComponet() {
    const { getApi } = useMap();
    const { mapId } = useContext(OwnerContext);
    const [ stage, setStage ] = useState<'button' | 'input' | 'requested'>('button');
    const [ name, setName ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();

    const onRequest = useCallback(async() => {
        if (name.length === 0) {
            setErrorMessage('名前を入力してください');
            return;
        }
        setStage('requested');
        await getApi().callApi(RequestAPI, {
            mapId,
            name,
        });
    }, [getApi, mapId, name]);

    switch(stage) {
        case 'button':
            return <Button variant='secondary' onClick={()=>setStage('input')}>登録申請</Button>

        case 'input':
            return (
                <div>
                    <div>
                        <Input type="text" placeholder='名前' value={name} onChange={(evt)=>setName(evt.target.value)} />
                        <Button variant='secondary' onClick={onRequest}>登録申請</Button>
                    </div>
                    <div className={styles.ErrorMessage}>
                        {errorMessage}
                    </div>
                </div>
            )

        case 'requested':
            return (
                <div className={styles.RequestedMessage}>登録申請しました。承認されるまで、しばらくお待ちください。</div>
            )
    }
}
