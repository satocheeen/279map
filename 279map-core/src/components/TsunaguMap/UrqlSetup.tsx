import React, { ReactElement } from 'react';
import { connectStatusAtom, recreatedGqlClientReducerAtom, serverInfoAtom } from '../../store/session';
import { useAtom } from 'jotai';
import { useWatch } from '../../util/useWatch2';
import { useAtomCallback } from 'jotai/utils';
import { cacheExchange, createClient, fetchExchange } from 'urql';
import { clientAtom } from 'jotai-urql';

type Props = {
    children: ReactElement | ReactElement[];
}

export default function UrqlSetup(props: Props) {
    /**
     * GraphQL Client生成
     */
    const [serverInfo] = useAtom(serverInfoAtom);
    const [, dispatch] = useAtom(recreatedGqlClientReducerAtom);
    const [connectStatus] = useAtom(connectStatusAtom);

    useWatch([serverInfo, connectStatus], 
        useAtomCallback((get, set) => {
            console.log('debug')
            const protocol = serverInfo.ssl ? 'https' : 'http';
            const url = `${protocol}://${serverInfo.host}/graphql`;

            const sessionid = connectStatus?.connect.sid ?? '';
            const urqlClient = createClient({
                url,
                exchanges: [cacheExchange, fetchExchange],
                fetchOptions: () => {
                    return {
                        headers: {
                            Authorization:  serverInfo.token ? `Bearer ${serverInfo.token}` : '',
                            sessionid,
                        },
                    }
                }
            })

            console.log('recreate GQLClient', connectStatus, sessionid);
            set(clientAtom, urqlClient);
            // dispatch();
        }
    ), { immediate: true })


    return (
        <>
        {props.children}
        </>
    );
}