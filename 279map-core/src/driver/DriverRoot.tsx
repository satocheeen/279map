import React, { useMemo, useState } from 'react';
import { useMounted } from '../util/useMounted';
import { getAuthConfig } from '../api';
import { Auth0Provider } from "@auth0/auth0-react";
import TestMap from './TestMap';
import { myMapServer } from './const';
import { ServerConfig } from '../graphql/generated/graphql';

/**
 * for Development
 */

type AuthContextValue = {
    authConfig: ServerConfig | undefined;
    token: string | undefined;
    setToken: (token: string) => void;
}
export const AuthContext = React.createContext<AuthContextValue>({
    authConfig: undefined,
    token: undefined,
    setToken: () => {},
});

export default function DriverRoot() {
    const [ authConfig, setAuthConfig ] = useState<ServerConfig>();
    const [ token, setToken ] = useState<string|undefined>();

    const authContextValue = useMemo((): AuthContextValue => {
        return {
            authConfig,
            token,
            setToken,
        }
    }, [authConfig, token]);

    /**
     * 起動時に認証定義情報を取得する
     */
    useMounted(() => {
        getAuthConfig(myMapServer.host, myMapServer.ssl)
        .then((result) => {
            setAuthConfig(result);
        })
    });

    if (!authConfig) {
        return null;
    }

    if (authConfig.__typename === 'Auth0Config') {
        console.log('debug', authConfig)
        return (
            <Auth0Provider
                domain={authConfig.domain}
                clientId={authConfig.clientId}
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: authConfig.audience,
                }}
            >
                <AuthContext.Provider value={authContextValue}>
                    <TestMap />
                </AuthContext.Provider>
            </Auth0Provider>
        );        
    } else {
        return (
            <AuthContext.Provider value={authContextValue}>
                <TestMap />
            </AuthContext.Provider>
        );        

    }
}