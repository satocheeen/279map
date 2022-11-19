import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MapKind} from '279map-common/dist/types';
import { RootState, useAppDispatch } from "../../store/configureStore";
import { dataActions } from "../../store/data/dataSlice";
import { loadMapDefine, loadOriginalIconDefine } from "../../store/data/dataThunk";
import { doCommand } from "../../util/Commander";
import { WebSocketMessage } from "279map-common/dist/api";

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

    /**
     * 地図ID指定時、地図データロード
     */
    useEffect(() => {
        if (!connected) {
            // 接続完了を待つ
            console.info('not connected.');
            return;
        }
        loadMap(mapKind ? mapKind as MapKind : undefined);
    }, [props.mapId, loadMap, connected]);

    const mapId = useSelector((state: RootState) => state.data.mapId);
    const mapKind = useSelector((state: RootState) => state.data.mapKind);

    const currentMapRef = useRef({ mapId, mapKind }); // startWss内で使用するmapKind。（リアクティブの必要はないので、refを用意）
    useEffect(() => {
        currentMapRef.current = {
            mapId,
            mapKind,
        };
    }, [mapId, mapKind]);

    /**
     * セッション開始
     */
     useEffect(() => {
        // WebSocket通信設定
        const startWss = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            console.log('env', process.env);
            const port = process.env.NODE_ENV === 'development' ? '80' : window.location.port;
    
            const socket = new WebSocket(protocol + "://" + document.domain + ':' + port);
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
                const message = JSON.parse(evt.data) as WebSocketMessage;
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

        fetch('/api/connect')
        .then(() => {
            console.log('connect');
            // WebSocket準備
            startWss();
        })
        .catch(() => {
            // TODO: エラー表示
            console.warn('connect failed.');
        });

        return (() => {
            fetch('/api/disconnect');
            wss.current?.close();
        });

    }, [dispatch]);

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