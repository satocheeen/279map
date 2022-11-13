import axios from "axios";
import { SnsOptions, SnsPost, SnsPostGetter } from './SnsPostGetter';
import { extractHashTag } from "./utility";

export const FbGraphApiAccessToken = process.env.FB_GRAPH_API_TOKEN || '';
export const FbGraphApiInstagramBusinessAccountId = process.env.FB_GRAPH_INSTAGRAM_BUSINESS_ACCOUNT_ID || '';

export type InstagramContentOptions = {
    type: 'InstagramUser';
    userName: string;
}
export default class InstagramPostGetter implements SnsPostGetter {
    /**
     * 指定のURLがInstagramの
     * @param url 
     * @returns 
     */
    static checkUrl(url: string): InstagramContentOptions | null {
        const instaRegex = /^(.*)instagram\.com\/([^\/]*)\/$/;
        if (instaRegex.test(url)) {
            const hit = url.match(instaRegex);
            if (!hit) {
                return null;
            }
            console.log('checkUrl', hit);
            const userName = hit[2];
            return {
                type: 'InstagramUser',
                userName,
            }
        }
        return null;
    }

    #option: InstagramContentOptions;

    constructor(option: InstagramContentOptions) {
        this.#option = option;
    }

    get type(): SnsOptions['type'] {
        return 'InstagramUser';
    }

    async getPosts(max: number) {
        const posts = await getInstagramPosts(this.#option.userName);
        const result = posts.map(post => {
            // ハッシュタグ除去
            const extractRes = extractHashTag(post.caption);
            const text = extractRes.text;

            return {
                id: post.id,
                text,
                hashtags: extractRes.tags,
                media: post.media_url ? {
                    type: post.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                    url: post.media_url,
                }: undefined,
                url: post.permalink,
                date: post.timestamp,
            } as SnsPost;
        });
        return result.slice(0, max);
    }

}
type InstagramPost = {
    id: string;
    caption: string;
    media_type: 'CAROUSEL_ALBUM' | 'IMAGE' | 'VIDEO';
    media_url?: string;
    permalink: string;
    timestamp: string;
}

type InstagramApiResult = {
    business_discovery: {
        media: {
            data: InstagramPost[];
            paging: {
                cursors: {};
            };
        };
        id: string;
    };
    id: string;
}

/**
 * 
 * @param userName 
 */
async function getInstagramPosts(userName: string): Promise<InstagramPost[]> {
    try {
        const url = 'https://graph.facebook.com/v14.0/' +  FbGraphApiInstagramBusinessAccountId + 
        '?fields=business_discovery.username(' + userName + '){media{caption,media_url,permalink,media_type,timestamp}}' + 
        '&access_token=' + FbGraphApiAccessToken;

        const result = await axios({
            url,
        });
        const apiResult = result.data as InstagramApiResult;
        return apiResult.business_discovery.media.data;

    } catch(e) {
        console.warn('Get Instagram Posts Failed.', e);
        return [];
    }
}

