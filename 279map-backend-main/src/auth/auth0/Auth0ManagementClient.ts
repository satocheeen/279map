import axios from "axios";
import { ManagementClient } from 'auth0';
import { Auth } from "279map-backend-common";

const domain = process.env.AUTH0_DOMAIN ?? '';
const client_id = process.env.AUTH0_BACKEND_CLIENT_ID ?? '';
const client_secret = process.env.AUTH0_BACKEND_CLIENT_SECRET ?? '';
const audience = `https://${domain}/api/v2/`;

type MapInfo = {
    auth_lv: Auth;
    name: string;
}
type AppMetaData = {
    maps: {[mapId: string]: MapInfo}
}
export class Auth0ManagementClient {
    #token: string | undefined;
    #management: ManagementClient | undefined;

    public async initialize() {
        // token取得
        const res = await axios({
            method: 'POST',
            url: `https://${domain}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            data: {
                client_id: client_id,
                client_secret: client_secret,
                audience: audience,
                grant_type: 'client_credentials',
            },
        });
        const token = res.data.access_token;
        console.log('backend token', token);
        this.#token = token;

        this.#management = new ManagementClient({
            token,
            domain,
        });
    }

    /**
     * 指定のユーザがユーザ登録している地図一覧を返す
     * @param userId 
     * @returns 地図id一覧
     */
    public async getUserMapList(userId: string): Promise<string[]> {
        if (!this.#management) {
            throw new Error('not initialize');
        }
        const res = await this.#management.getUser({id: userId});
        if (!res.app_metadata) {
            return [];
        }
        const metadata = res.app_metadata as AppMetaData;
        return Object.keys(metadata.maps);
    }
}