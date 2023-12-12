import React, { useCallback, useState, useEffect, useContext, useMemo, useRef } from 'react';
import { instanceIdAtom, mapDefineAtom } from '../../store/session';
import { ErrorType } from 'tsunagumap-api';
import Overlay from '../common/spinner/Overlay';
import { Button } from '../common';
import Input from '../common/form/Input';
import styles from './MapConnector.module.scss';
import { createMqttClientInstance, destroyMqttClientInstance, useSubscribe } from '../../api/useSubscribe';
import { Auth } from '279map-common';
import { useAtom } from 'jotai';
import { MyError } from '../../api/api';
import { ServerInfo, TsunaguMapProps } from '../../types/types';
import { clientAtom } from 'jotai-urql';
import { ConnectDocument, ConnectResult, DisconnectDocument, RequestDocument } from '../../graphql/generated/graphql';
import { OwnerContext } from './TsunaguMap';
import { Provider, createStore } from 'jotai';
import { defaultIconDefineAtom } from '../../store/icon';
import { createGqlClient } from '../../api';

type Props = {
    server: ServerInfo;
    mapId: string;
    iconDefine: TsunaguMapProps['iconDefine'];
    children: React.ReactNode | React.ReactNode[];
}

function createMyStore(iconDefine: TsunaguMapProps['iconDefine']) {
    const store = createStore();
    if (iconDefine) {
        store.set(defaultIconDefineAtom, iconDefine);
    }
    return store;
}

/**
 * 地図サーバとのセッションを確立する。
 * セッション確立後、子コンポーネントを描画する。
 * @param props 
 * @returns 
 */
export default function MapConnector(props: Props) {
    const { onConnect } = useContext(OwnerContext);
    const onConnectRef = useRef(onConnect);
    useEffect(() => {
        onConnectRef.current = onConnect;
    }, [onConnect]);
    const [instanceId ] = useAtom(instanceIdAtom);
    
    const { getSubscriber } = useSubscribe();

    // Subscriber用意
    useEffect(() => {
        createMqttClientInstance(instanceId, props.server, props.mapId);

        return () => {
            destroyMqttClientInstance(instanceId);
        }
    }, [instanceId, props.server, props.mapId]);

    const [ loading, setLoading ] = useState(true);
    const [ connectStatus, setConnectStatus ] = useState<ConnectResult|undefined>();
    const [ errorType, setErrorType ] = useState<ErrorType|undefined>();
    const myStoreRef = useRef(createMyStore(props.iconDefine));

    const connect = useCallback(async() => {
        try {
            setLoading(true);
            setErrorType(undefined);
            const gqlClient = createGqlClient(props.server);
            console.log('connect to', props.mapId, props.server.token);
    
            const result = await gqlClient.mutation(ConnectDocument, { mapId: props.mapId });
            if (!result.data) {
                if (result.error?.graphQLErrors[0]) {
                    const errorType = result.error?.graphQLErrors[0].extensions.type as ErrorType;
                    setErrorType(errorType);
                } else {
                    setErrorType(ErrorType.IllegalError);
                }
                return;
            }
            setConnectStatus(result.data.connect);
            const mapDefine = result.data.connect.mapDefine;
            const authLv = result.data.connect.connect.authLv;
            myStoreRef.current.set(mapDefineAtom, {
                ...mapDefine,
                authLv,
                connected: true,
            });

            const sessionid = result.data?.connect.connect.sid ?? '';
            const urqlClient = createGqlClient(props.server, sessionid);
            myStoreRef.current.set(clientAtom, urqlClient);
            console.log('connected');

            if (onConnectRef.current) {
                onConnectRef.current({
                    mapDefine: result.data.connect.mapDefine,
                    authLv,
                })
            }

        } catch(e) {
            console.warn(e);
            setErrorType(ErrorType.IllegalError);

        } finally {
            setLoading(false);

        }
    }, [props.server, props.mapId])

    const disconnect = useCallback(async() => {
        const gqlClient = myStoreRef.current.get(clientAtom);
        await gqlClient.mutation(DisconnectDocument, {});
    }, []);

    useEffect(() => {
        // IDカウントアップ
        myStoreRef.current.set(instanceIdAtom);
        const id = myStoreRef.current.get(instanceIdAtom);
        console.log('MapConnector mounted', id);

        return () => {
            console.log('MapConnector unmounted', id);
        }
    }, []);

    useEffect(() => {
        connect();

        window.addEventListener('beforeunload', () => {
            disconnect();
        })

        return () => {
            disconnect();
        }
    }, [connect, disconnect])

    // const [, connectDispatch] = useAtom(connectReducerAtom);
    // useEffect(() => {
    //     const userId = function() {
    //         if (connectLoadable.state === 'hasError') {
    //             const e = connectLoadable.error as any;
    //             const error: MyError = ('apiError' in e) ? e.apiError
    //                                 : {type: ErrorType.IllegalError, detail: e + ''};
    //             return error?.userId;
    //         } else if (connectLoadable.state === 'hasData') {
    //             return connectLoadable.data?.connect.userId;
    //         } else {
    //             return undefined;
    //         }
    //     }();
    //     if (!userId) return;
    //     const subscriber = getSubscriber();
    //     if (!subscriber) return;
    //     subscriber?.setUser(userId);

    //     const h = subscriber.subscribeUser('update-userauth', () => {
    //         // 権限変更されたので再接続
    //         connectDispatch();
    //     });

    //     return () => {
    //         if (h)
    //             subscriber.unsubscribe(h);
    //     }
    // }, [/* connectLoadable, getSubscriber, connectDispatch */])


    // ゲストモードで動作させる場合、true
    const [guestMode, setGuestMode] = useState(false);
    const onRequestCancel = useCallback(() => {
        setGuestMode(true);
    }, []);

    const showRequestPanel = useMemo(() => {
        if (guestMode) {
            return false;
        }
        if (!props.server.token) {
            return false;
        }
        if (!connectStatus) {
            return false;
        }
        if (connectStatus.mapDefine.options?.newUserAuthLevel === Auth.None) {
            // 新規ユーザ登録禁止の地図では表示しない
            return false;
        }
        return connectStatus.connect.authLv === Auth.None;

    }, [guestMode, connectStatus, props.server]);

    const errorMessage = useMemo(() => {
        switch(errorType) {
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
    }, [errorType]);


    if (loading) {
        return <Overlay spinner message='ロード中...' />
    }

    if (errorType) {
        return (
            <Overlay message={errorMessage}>
                {errorType === ErrorType.NoAuthenticate &&
                    <RequestComponet />
                }
            </Overlay>
        );
    }

    return (
        <>
            <Provider store={myStoreRef.current}>
                {props.children}
            </Provider>
            {showRequestPanel &&
                <Overlay message="ユーザ登録しますか？">
                    <RequestComponet stage='input' onCancel={onRequestCancel} />
                </Overlay>
            }
        </>
    );

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
    const { mapId } = useContext(OwnerContext);
    const [ gqlClient ] = useAtom(clientAtom);
    const [ stage, setStage ] = useState<RequestComponetStage>(props.stage ?? 'button');
    const [ name, setName ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState<string|undefined>();

    const onRequest = useCallback(async() => {
        if (name.length === 0) {
            setErrorMessage('名前を入力してください');
            return;
        }
        setStage('requested');
        await gqlClient.mutation(RequestDocument, {
            mapId,
            name,
        });
    }, [gqlClient, mapId, name]);

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
