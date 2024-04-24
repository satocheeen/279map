import React, { useCallback, useState, useEffect, useContext, useMemo, useRef } from 'react';
import { instanceIdAtom, mapDefineAtom } from '../../store/session';
import Overlay from '../common/spinner/Overlay';
import { Button } from '../common';
import Input from '../common/form/Input';
import styles from './MapConnector.module.scss';
import { useAtom } from 'jotai';
import { ServerInfo, TsunaguMapProps } from '../../types/types';
import { clientAtom } from 'jotai-urql';
import { Auth, ConnectDocument, ConnectErrorType, ConnectResult, DisconnectDocument, ErrorDocument, RequestDocument, UpdateUserAuthDocument } from '../../graphql/generated/graphql';
import { OwnerContext } from './TsunaguMap';
import { Provider, createStore } from 'jotai';
import { defaultIconDefineAtom } from '../../store/icon';
import { createGqlClient } from '../../api';
import { useWatch } from '../../util/useWatch2';
import { Subscription } from 'wonka';
import { useMapController } from '../../store/map/useMapController';
import { MapKind } from '../../types-common/common-types';

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
    
    const [ loading, setLoading ] = useState(true);
    const [ connectStatus, setConnectStatus ] = useState<ConnectResult|undefined>();
    const [ connectErrorType, setConnectErrorType ] = useState<ConnectErrorType|undefined>();
    const myStoreRef = useRef<ReturnType<typeof createStore>|undefined>();
    const [ userId, setUserId ] = useState<string|undefined>();
    const errorHandlerRef = useRef<Subscription>();
    const [ defaultMapKind, setDefaultMapKind ] = useState<MapKind|undefined>();

    const connect = useCallback(async() => {
        try {
            myStoreRef.current = createMyStore(props.iconDefine);
            setLoading(true);
            setConnectStatus(undefined);
            setConnectErrorType(undefined);
            const gqlClient = createGqlClient(props.server);
            myStoreRef.current.set(clientAtom, gqlClient);
            console.log('connect to', props.mapId, props.server.token);
    
            const result = await gqlClient.mutation(ConnectDocument, { mapId: props.mapId });
            if (!result.data) {
                if (result.error?.graphQLErrors[0]) {
                    const errorExtensions = result.error.graphQLErrors[0].extensions;
                    const errorType = errorExtensions.type as ConnectErrorType;
                    const userId = errorExtensions.userId as string | undefined;
                    setConnectErrorType(errorType);
                    setUserId(userId);
                } else {
                    setConnectErrorType(ConnectErrorType.IllegalError);
                }
                return;
            }
            setConnectStatus(result.data.connect);
            const mapDefine = result.data.connect.mapDefine;
            const authLv = result.data.connect.connect.authLv;
            const userName = result.data.connect.connect.userName ?? undefined;
            myStoreRef.current.set(mapDefineAtom, {
                ...mapDefine,
                authLv,
                connected: true,
            });

            const sessionid = result.data?.connect.connect.sid ?? '';
            const urqlClient = createGqlClient(props.server, sessionid);
            myStoreRef.current.set(clientAtom, urqlClient);
            console.log('connected');
            // TODO:エラー受付処理
            if (errorHandlerRef.current) {
                errorHandlerRef.current.unsubscribe();
            }
            errorHandlerRef.current = urqlClient.subscription(ErrorDocument, { sid: sessionid }).subscribe((errorInfo) => {
                console.log('catch error', errorInfo.data?.error);
            })

            let mapKind = result.data.connect.mapDefine.defaultMapKind;
            if (onConnectRef.current) {
                const callbackResult = await onConnectRef.current({
                    mapDefine: result.data.connect.mapDefine,
                    authLv,
                    userName,
                });
                if (callbackResult && callbackResult.mapKind) {
                    mapKind = callbackResult.mapKind;
                }
            }
            setDefaultMapKind(mapKind);

            setUserId(result.data.connect.connect.userId ?? undefined);


        } catch(e) {
            console.warn(e);
            setConnectErrorType(ConnectErrorType.IllegalError);

        } finally {
            setLoading(false);

        }
    }, [props.server, props.mapId, props.iconDefine]);

    const disconnect = useCallback(async() => {
        if (errorHandlerRef.current) {
            errorHandlerRef.current.unsubscribe();
            errorHandlerRef.current = undefined;
        }
        if (!myStoreRef.current) return;
        const gqlClient = myStoreRef.current.get(clientAtom);
        await gqlClient.mutation(DisconnectDocument, {});
        console.log('disconnected');
    }, []);

    useEffect(() => {
        if (!myStoreRef.current) return;

        // IDカウントアップ
        myStoreRef.current.set(instanceIdAtom);
        const id = myStoreRef.current.get(instanceIdAtom);
        console.log('MapConnector mounted', id);

        return () => {
            console.log('MapConnector unmounted', id);
        }
    }, []);

    useWatch([props.server, props.mapId], async() => {
        if (connectStatus) {
            await disconnect()
        }
        connect()
        .then(() => {
            window.addEventListener('beforeunload', () => {
                disconnect();
            })
        })

        return () => {
            disconnect();
        }

    }, { immediate: true });

    useEffect(() => {
        if (!userId || !myStoreRef.current) return;
        const urqlClient = myStoreRef.current.get(clientAtom);
        const h = urqlClient.subscription(UpdateUserAuthDocument, { userId, mapId: props.mapId }).subscribe(() => {
            // 権限変更されたので再接続
            connect();
        })

        return () => {
            h.unsubscribe();
        }

    }, [ userId, props.mapId, connect ])

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
        switch(connectErrorType) {
            case ConnectErrorType.UndefinedMap:
                return '指定の地図は存在しません';
            case ConnectErrorType.Unauthorized:
                return 'この地図を表示するには、ログインが必要です';
            case ConnectErrorType.Forbidden:
                return '認証期限が切れている可能性があります。再ログインを試してください。問題が解決しない場合は、管理者へ問い合わせてください。';
            case ConnectErrorType.NoAuthenticate:
                return 'この地図に入るには管理者の承認が必要です';
            case ConnectErrorType.Requesting:
                return '管理者からの承認待ちです';
            case ConnectErrorType.SessionTimeout:
                return 'しばらく操作されなかったため、セッション接続が切れました。再ロードしてください。';
            default:
                return '想定外の問題が発生しました。再ロードしても問題が解決しない場合は、管理者へ問い合わせてください。';
        }
    }, [connectErrorType]);
    

    if (loading || !defaultMapKind) {
        return <Overlay spinner message='ロード中...' />
    }

    if (connectErrorType) {
        return (
            <Overlay message={errorMessage}>
                {connectErrorType === ConnectErrorType.NoAuthenticate &&
                    <RequestComponet />
                }
            </Overlay>
        );
    }

    return (
        <>
            <Provider store={myStoreRef.current}>
                <DefaultMapLoader mapKind={defaultMapKind}>
                    {props.children}
                </DefaultMapLoader>
            </Provider>
            {showRequestPanel &&
                <Overlay message="ユーザ登録しますか？">
                    <RequestComponet stage='input' onCancel={onRequestCancel} />
                </Overlay>
            }
        </>
    );

}

type DefaultMapLoaderProps = {
    mapKind: MapKind;   // 初期表示する地図種別
    children: any;
}
/**
 * デフォルトの地図種別をロードする
 * jotai有効化された状態で動作させたいので、コンポーネントとして用意している
 */
function DefaultMapLoader(props: DefaultMapLoaderProps) {
    const { loadMap } = useMapController();
    const [ mapDefine ] = useAtom(mapDefineAtom);

    useEffect(() => {
        loadMap(props.mapKind);
    }, [mapDefine, loadMap, props.mapKind])

    return (
        <>
            {props.children}
        </>
    )
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
