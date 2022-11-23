import { useCallback, useContext, useRef, useMemo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MapKind} from '279map-common';
import { RootState, useAppDispatch } from "../../store/configureStore";
import { dataActions } from "../../store/data/dataSlice";
import { loadMapDefine, loadOriginalIconDefine } from "../../store/data/dataThunk";
import { doCommand } from "../../util/Commander";
import { api } from "279map-common";
import { OwnerContext } from "./TsunaguMap";
import { useAPI } from "../../api/useAPI";
import { sessionActions } from "../../store/session/sessionSlice";
import { useCallbackWrapper } from "../../util/useCallbackWrapper";

type Prop = {
    mapId: string;
    auth?: string;
}
/**
 * セッションを管理するフック
 */
export default function useSession(props: Prop) {
    // 接続完了しているか。接続完了後に地図データをロードさせるために用意。
    const [ connected, setConnected ] = useState(false);
    const loadingId = useRef<string>(); // ロード処理中の地図ID（二重ロード防止用）
    const dispatch = useAppDispatch();
    const wss = useRef<WebSocket>();
    const mapServer = useSelector((state: RootState) => state.session.mapServer);
    const ownerContext = useContext(OwnerContext);
    const onConnect = useCallbackWrapper(ownerContext.onConnect);

    /**
     * 地図定義ロード
     * @param mapKind ロードする地図種別。未指定の場合は、デフォルトの地図を読み込む。
     */
    const loadMap = useCallback(async(mapKind?: MapKind): Promise<void> => {
        // 二重ロード禁止
        if (loadingId.current === props.mapId) {
            console.warn('二重ロード禁止');
            return;
        }
        loadingId.current = props.mapId;
        console.log('start load mapInfo', props.mapId);

        try {
            await dispatch(loadMapDefine({
                mapId: props.mapId,
                auth: props.auth ?? undefined,
                mapKind,
            }));

            await dispatch(loadOriginalIconDefine());

            loadingId.current = undefined;

        } catch(e){
            // TODO: エラーメッセージ表示
            console.warn(e);
            return;
        }

    }, [dispatch, props.mapId, props.auth]);

    const mapId = useSelector((state: RootState) => state.data.mapId);
    const mapKind = useMemo(() => ownerContext.mapKind, [ownerContext.mapKind]);

    /**
     * 地図ID指定時、地図データロード
     */
    useEffect(() => {
        if (!connected) {
            // 接続完了を待つ
            console.info('not connected.');
            return;
        }
        loadMap(mapKind);
    }, [props.mapId, loadMap, mapKind, connected]);

    const currentMapRef = useRef({ mapId, mapKind }); // startWss内で使用するmapKind。（リアクティブの必要はないので、refを用意）
    useEffect(() => {
        currentMapRef.current = {
            mapId,
            mapKind,
        };
    }, [mapId, mapKind]);

    const { apiUrl } = useAPI();
    /**
     * セッション開始
     */
     useEffect(() => {
        if (mapServer.domain.length === 0) {
            return;
        }
        // WebSocket通信設定
        const startWss = () => {
            const protocol = mapServer.ssl ? 'wss' : 'ws';
            const domain = mapServer.domain;
    
            const socket = new WebSocket(protocol + "://" + domain);
            socket.addEventListener('open', () => {
                console.log('websocket connected');
                setConnected(true);
                // サーバー再接続時を考慮して、現在の地図情報を送信
                socket?.send(JSON.stringify(currentMapRef.current));
            });
            socket.addEventListener('close', () => {
                console.log('websocket closed');
                // サーバーが瞬断された可能性があるので再接続試行
                startWss();
            });
            socket.addEventListener('error', (err) => {
                console.warn('websocket error', err);
            });
            socket.addEventListener('message', (evt) => {
                console.log('websocket message', evt.data);
                const message = JSON.parse(evt.data) as api.WebSocketMessage;
                if (message.type === 'updated') {
                    doCommand({
                        command: "LoadLatestData",
                        param: undefined,
                    });
                } else if (message.type === 'delete') {
                    // アイテム削除
                    dispatch(dataActions.removeItems(message.itemPageIdList));
                }
            });
            wss.current = socket;
        };

        fetch(apiUrl + 'connect?mapId=' + ownerContext.mapId, {
            credentials: "include",
        })
        .then((result) => {
            return result.json();
        })
        .then((result: api.ConnectResult) => {
            dispatch(dataActions.setMapDefine(result));
            dispatch(sessionActions.setAuth(result.authLv));
            // WebSocket準備
            startWss();

            onConnect.call(result);
        })
        .catch(() => {
            // TODO: エラー表示
            console.warn('connect failed.');
        });

        return (() => {
            fetch(apiUrl + 'disconnect', {
                credentials: 'include',
            });
            wss.current?.close();
        });

    }, [dispatch, mapServer, apiUrl, onConnect.call, ownerContext.mapId]);

    // useEffect(() => {
    //     if (!mapId) {
    //         return;
    //     }
    //     // WebSocket準備
    //     startWss();

    //     return () => {
    //         wss.current?.close();
    //     }
    // }, [mapId, startWss]);
}