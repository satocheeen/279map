import { useAtom } from 'jotai';
import React, { ReactElement } from 'react';
import { connectStatusAtom, serverInfoAtom } from '../../store/session';
import { createClient, cacheExchange, fetchExchange } from "urql";
import { clientAtom } from 'jotai-urql'
import { useWatch } from '../../util/useWatch2';

type Props = {
    children: ReactElement[];
}
export default function MyGraphQLProvider(props: Props) {
    const [serverInfo] = useAtom(serverInfoAtom);
    const [connectStatus] = useAtom(connectStatusAtom);
    const [, setClient] = useAtom(clientAtom);

    useWatch([serverInfo, connectStatus], () => {
        const protocol = serverInfo.ssl ? 'https' : 'http';
        const url = `${protocol}://${serverInfo.host}/graphql`;

        const urqlClient = createClient({
            url,
            exchanges: [cacheExchange, fetchExchange],
            fetchOptions: () => {
                return {
                    headers: {
                        Authorization:  serverInfo.token ? `Bearer ${serverInfo.token}` : '',
                        sessionid: connectStatus.sid ?? '',
                    },
                }
            }
        })

        setClient(urqlClient);
    }, { immediate: true })

    return (
        <>
            {props.children}
        </>
    );
}
