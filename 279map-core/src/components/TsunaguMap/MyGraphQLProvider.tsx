import { useAtom } from 'jotai';
import React, { ReactElement, useMemo } from 'react';
import { connectStatusAtom, serverInfoAtom } from '../../store/session';
import { createClient, cacheExchange, fetchExchange,Provider as UrqlProvider } from "urql";
import { useHydrateAtoms } from 'jotai/utils';
import { clientAtom } from 'jotai-urql'

type Props = {
    children: ReactElement[];
}
export default function MyGraphQLProvider(props: Props) {
    const [serverInfo] = useAtom(serverInfoAtom);
    const [connectStatus] = useAtom(connectStatusAtom);

    const client = useMemo(() => {
        const protocol = serverInfo.ssl ? 'https' : 'http';
        const url = `${protocol}://${serverInfo.host}/graphql`;
    
        return createClient({
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
    }, [serverInfo, connectStatus]); 

    useHydrateAtoms([[clientAtom, client]])

    return (
        <UrqlProvider value={client}>
            {props.children}
        </UrqlProvider>
    );
}
