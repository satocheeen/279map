import React, { useCallback, useState, useContext, useEffect } from 'react';
import { OwnerContext } from './TsunaguMap';
import { useWatch } from '../../util/useWatch';
import { connectStatusLoadableAtom, instanceIdAtom, mapIdAtom, mapServerAtom, refreshConnectStatusAtom } from '../../store/session';
import { ErrorType, RequestAPI } from 'tsunagumap-api';
import Overlay from '../common/spinner/Overlay';
import { Button } from '../common';
import Input from '../common/form/Input';
import styles from './MapConnector.module.scss';
import { useSubscribe } from '../../util/useSubscribe';
import { Auth } from '279map-common';
import { createMqttClientInstance, destroyMqttClientInstance } from '../../store/session/MqttInstanceManager';
import { useAtom } from 'jotai';
import { MyError, MyErrorType } from '../../api';
import { useApi } from '../../api/useApi';
import { usePrevious } from '../../util/usePrevious';

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
    const [mapId, setMapId] = useAtom(mapIdAtom);
    const [mapServer, setMapServer] = useAtom(mapServerAtom);
    const [connectLoadable] = useAtom(connectStatusLoadableAtom);
    const [instanceId, setInstanceId ] = useAtom(instanceIdAtom);
    const { createAPI, destroyAPI } = useApi();

    useEffect(() => {
        setMapId(ownerContext.mapId);
    }, [ownerContext.mapId, setMapId]);

    useEffect(() => {
        setInstanceId(ownerContext.mapInstanceId);
        setMapServer(ownerContext.mapServer);

        return () => {
            setInstanceId('');
            setMapServer(undefined);
        }
    }, [ownerContext.mapInstanceId, ownerContext.mapServer, setInstanceId, setMapServer]);

    /**
     * 地図接続情報が変化したら、API, Mqtt初期化
     */
    const prevMapServer = usePrevious(ownerContext.mapServer);
    useEffect(() => {
        if (JSON.stringify(ownerContext.mapServer) === JSON.stringify(prevMapServer)) {
            return;
        }

        // API Accessor用意
        createAPI((error) => {
            // コネクションエラー時(リロードが必要なエラー)
            console.warn('connection error', error);
        });
        // Mqtt接続
        const id = ownerContext.mapInstanceId;
        createMqttClientInstance(id, ownerContext.mapServer);

        return () => {
            destroyAPI();
            destroyMqttClientInstance(id);
        }

    }, [createAPI, destroyAPI]);

    const { subscribeUser, unsubscribeUser } = useSubscribe();
    const [refreshConnectStatus, setRefreshConnectStatus] = useAtom(refreshConnectStatusAtom);
    useWatch(() => {
        subscribeUser('update-userauth', () => {
            // 権限変更されたので再接続
            setRefreshConnectStatus((cur) => cur+1);
        });

        return () => {
            unsubscribeUser('update-userauth');
        }
    }, [subscribeUser, unsubscribeUser]);

    // ゲストモードで動作させる場合、true
    const [guestMode, setGuestMode] = useState(false);
    const onRequestCancel = useCallback(() => {
        setGuestMode(true);
    }, []);

    switch (connectLoadable.state) {
        case 'hasData':
            // Auth0ログイン済みだが、地図ユーザ未登録の場合は、登録申請フォーム表示
            const showRequestPanel = function() {
                if (guestMode) {
                    return false;
                }
                if (!ownerContext.mapServer.token) {
                    return false;
                }
                if (connectLoadable.data.mapDefine.options?.newUserAuthLevel === Auth.None) {
                    // 新規ユーザ登録禁止の地図では表示しない
                    return false;
                }
                return connectLoadable.data.mapDefine.authLv === Auth.None;
            }();
            return (
                <>
                    {props.children}
                    {showRequestPanel &&
                        <Overlay message="ユーザ登録しますか？">
                            <RequestComponet stage='input' onCancel={onRequestCancel} />
                        </Overlay>
                    }
                </>
            );
        case 'loading':
            return <Overlay spinner message='ロード中...' />

        case 'hasError':
            const e = connectLoadable.error as any;
            const error: MyError = ('apiError' in e) ? e.apiError
                                : {type: ErrorType.IllegalError, detail: e + ''};

            if (error.type === MyErrorType.NonInitialize) {
                return <Overlay spinner message='初期化中...' />
            }
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
type RequestComponetStage = 'button' | 'input' | 'requested';
type RequestComponetProps = {
   stage?: RequestComponetStage;
   onCancel?: () => void;
}
function RequestComponet(props: RequestComponetProps) {
    const { callApi } = useApi();
    const { mapId } = useContext(OwnerContext);
    const [ stage, setStage ] = useState<RequestComponetStage>(props.stage ?? 'button');
    const [ name, setName ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();

    const onRequest = useCallback(async() => {
        if (name.length === 0) {
            setErrorMessage('名前を入力してください');
            return;
        }
        setStage('requested');
        await callApi(RequestAPI, {
            mapId,
            name,
        });
    }, [callApi, mapId, name]);

    const onCancel = useCallback(() => {
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props]);

    switch(stage) {
        case 'button':
            return <Button variant='secondary' onClick={()=>setStage('input')}>登録申請</Button>

        case 'input':
            return (
                <div>
                    <div>
                        <Input type="text" placeholder='名前' value={name} onChange={(evt)=>setName(evt.target.value)} />
                        <Button variant='secondary' onClick={onRequest}>登録申請</Button>
                        {props.onCancel &&
                            <Button variant='secondary' onClick={onCancel}>キャンセル</Button>
                        }
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
