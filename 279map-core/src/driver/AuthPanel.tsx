import React, { useCallback, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useWatch } from '../util/useWatch';
import { AuthContext } from './DriverRoot';
import styles from './TestMap.module.scss';

export default function AuthPanel() {
    const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
    const { authConfig, setToken } = useContext(AuthContext);

    useWatch(() => {
        if (!authConfig) return;
        switch(authConfig.__typename) {
            case 'Auth0Config':
                if (!isAuthenticated) return;
                getAccessTokenSilently()
                .then(token => {
                    setToken(token);
                    console.log('token', token);
                });
                break;

            default:
                return;
        }
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
        <div className={styles.Col}>
            {!isAuthenticated ?
                <button onClick={onLogin}>Sign in / Sign up</button>
                :
                <button onClick={onLogout}>Sign out</button>
            }
        </div>
);
}