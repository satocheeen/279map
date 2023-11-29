import React, { useCallback, useState, useEffect, useContext } from 'react';
import { instanceIdAtom, mapIdAtom, connectReducerAtom, serverInfoAtom, recreatedGqlClientReducerAtom, connectStatusAtom } from '../../store/session';
import { ErrorType } from 'tsunagumap-api';
import Overlay from '../common/spinner/Overlay';
import { Button } from '../common';
import Input from '../common/form/Input';
import styles from './MapConnector.module.scss';
import { createMqttClientInstance, destroyMqttClientInstance, useSubscribe } from '../../api/useSubscribe';
import { Auth } from '279map-common';
import { useAtom } from 'jotai';
import { MyError, MyErrorType } from '../../api/api';
import { useApi } from '../../api/useApi';
import { ServerInfo } from '../../types/types';
import { clientAtom } from 'jotai-urql';
import { ConnectDocument, RequestDocument } from '../../graphql/generated/graphql';
import { useWatch } from '../../util/useWatch2';
import { cacheExchange, createClient, fetchExchange } from 'urql';
import { useAtomCallback } from 'jotai/utils';
import { map } from 'wonka';
import { OwnerContext } from './TsunaguMap';

type Props = {
    server: ServerInfo;
    children: React.ReactNode | React.ReactNode[];
}

/**
 * 地図サーバとのセッションを確立する。
 * セッション確立後、子コンポーネントを描画する。
 * @param props 
 * @returns 
 */
export default function MapConnector(props: Props) {
    const { onConnect } = useContext(OwnerContext);
    const [instanceId ] = useAtom(instanceIdAtom);
    const [ mapId ] = useAtom(mapIdAtom);
    
    const { getSubscriber } = useSubscribe();

    // Subscriber用意
    useEffect(() => {
        createMqttClientInstance(instanceId, props.server, mapId);

        return () => {
            destroyMqttClientInstance(instanceId);
        }
    }, [instanceId, props.server, mapId]);

    const [ loading, setLoading ] = useState(false);

    const connect = useAtomCallback(
        useCallback(async(get, set, mapId: string) => {
            try {
                // get(connectReducerAtom);
        
                console.log('connect to', mapId);
        
                setLoading(true);
                const gqlClient = get(clientAtom);
                const result = await gqlClient.mutation(ConnectDocument, { mapId });
                if (!result.data) {
                    throw new Error('connect failed. ' + result.error)
                }
                set(connectStatusAtom, result.data.connect);
                setLoading(false);

                if (onConnect) {
                    onConnect({
                        mapDefine: result.data.connect.mapDefine,
                    })
                }
    
            } catch(e) {
                console.warn(e);
                // throw new ApiException({
                //     type: ErrorType.IllegalError,
                //     detail: e + '',
                // })
            }    
        }, [])
    );

    useEffect(() => {
        console.log('debug');
        connect(mapId)
    }, [mapId, connect])

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

    const { hasToken } = useApi()

    return <div>Test</div>

    // switch (connectLoadable.state) {
    //     case 'hasData':
    //         // Auth0ログイン済みだが、地図ユーザ未登録の場合は、登録申請フォーム表示
    //         const showRequestPanel = function() {
    //             if (guestMode) {
    //                 return false;
    //             }
    //             if (!hasToken) {
    //                 return false;
    //             }
    //             if (connectLoadable.data?.mapDefine.options?.newUserAuthLevel === Auth.None) {
    //                 // 新規ユーザ登録禁止の地図では表示しない
    //                 return false;
    //             }
    //             return connectLoadable.data?.connect.authLv === Auth.None;
    //         }();
    //         return (
    //             <>
    //                 {props.children}
    //                 {showRequestPanel &&
    //                     <Overlay message="ユーザ登録しますか？">
    //                         <RequestComponet stage='input' onCancel={onRequestCancel} />
    //                     </Overlay>
    //                 }
    //             </>
    //         );
    //     case 'loading':
    //         return <Overlay spinner message='ロード中...' />

    //     case 'hasError':
    //         const e = connectLoadable.error as any;
    //         const error: MyError = ('apiError' in e) ? e.apiError
    //                             : {type: ErrorType.IllegalError, detail: e + ''};

    //         if (error.type === MyErrorType.NonInitialize) {
    //             return <Overlay spinner message='初期化中...' />
    //         }
    //         const errorMessage = function(): string {
    //             switch(error.type) {
    //                 case ErrorType.UndefinedMap:
    //                     return '指定の地図は存在しません';
    //                 case ErrorType.Unauthorized:
    //                     return 'この地図を表示するには、ログインが必要です';
    //                 case ErrorType.Forbidden:
    //                     return '認証期限が切れている可能性があります。再ログインを試してください。問題が解決しない場合は、管理者へ問い合わせてください。';
    //                 case ErrorType.NoAuthenticate:
    //                     return 'この地図に入るには管理者の承認が必要です';
    //                 case ErrorType.Requesting:
    //                     return '管理者からの承認待ちです';
    //                 case ErrorType.SessionTimeout:
    //                     return 'しばらく操作されなかったため、セッション接続が切れました。再ロードしてください。';
    //                 default:
    //                     return '想定外の問題が発生しました。再ロードしても問題が解決しない場合は、管理者へ問い合わせてください。';
    //             }
    //         }();
    //         const detail = error.detail ? `\n${error.detail}` : '';
    //         return (
    //             <Overlay message={errorMessage + detail}>
    //                 {error.type === ErrorType.NoAuthenticate &&
    //                     <RequestComponet />
    //                 }
    //             </Overlay>
    //         );
    // }
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
    const [ gqlClient ] = useAtom(clientAtom);
    const [ mapId ] = useAtom(mapIdAtom);
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
