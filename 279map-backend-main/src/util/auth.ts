import { Auth } from "279map-common";
import axios from "axios";
import { getLogger } from "log4js";

const apiLogger = getLogger('api');

/**
 * get the user's Auth Level
 * @param auth 
 * @returns Auth Level. if failed, return undefined.
 */
export async function callAuthApi(auth?: string): Promise<Auth | undefined> {
    const url = `http://${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}/auth/`;
    try {
        let result;
        const res = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
                auth,
            },
        });
        result = res.data;
        return result as Auth;
    
    } catch (e) {
        apiLogger.warn('connecting authenticate server failed:' + url + e);
        return undefined;
    }    
}