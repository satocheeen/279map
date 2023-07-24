import React, { useCallback, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useWatch } from '../util/useWatch';
import { AuthContext } from './DriverRoot';
import { AuthMethod } from '279map-common';

export default function AuthPanel() {
    const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
    const { authConfig, setToken } = useContext(AuthContext);

    useWatch(() => {
        if (authConfig?.authMethod !== AuthMethod.Auth0) return;
        if (!isAuthenticated) return;
        getAccessTokenSilently(
            {
                authorizationParams: {
                    audience: authConfig.auth0.audience,
                }
            }
        )
        .then(token => {
            setToken(token);
            console.log('token', token);
        });
    }, [isAuthenticated, authConfig, getAccessTokenSilently, setToken]);

    const onLogin = useCallback(() => {
        loginWithRedirect();
    }, [loginWithRedirect]);

    const onLogout = useCallback(() => {
        logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    }, [logout]);

    return (
        <div>
            {!isAuthenticated ?
                <button onClick={onLogin}>Sign in / Sign up</button>
                :
                <button onClick={onLogout}>Sign out</button>
            }
        </div>
);
}