import InstagramPostGetter, { InstagramContentOptions } from "./instagram";

export type SnsPost = {
    id: string;
    text: string;
    hashtags: string[];
    url: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date: string;
}
export interface SnsPostGetter {
    type: SnsOptions['type'];
    getPosts(max: number): Promise<SnsPost[]>;
}
export type SnsOptions = InstagramContentOptions;

/**
 * 指定のURLに対応するSNS定義情報を返す
 * @param url 
 * @returns SNS定義情報。これを用いてgetSnsPostGetterで投稿を取得する。対応するものがない場合は、nullを返却。
 */
export function getSnsOptionByUrl(url: string): SnsOptions | null {
    const instagram = InstagramPostGetter.checkUrl(url);
    if (instagram) {
        return instagram;
    }
    return null;
}
/**
 * 指定のオプションに対応するSnsPostGetterを返す
 * @param options 
 * @returns 
 */
export function getSnsPostGetter(options: SnsOptions): SnsPostGetter | null {
    if (options.type === 'InstagramUser') {
        return new InstagramPostGetter(options);
    }
    return null;
}
/**
 * 指定のURLに対応するSnsPostGetterを返す
 * @param url 
 * @returns 
 */
export function getSnsPostGetterByUrl(url: string): SnsPostGetter | null {
    const options = getSnsOptionByUrl(url);
    if (!options) {
        return null;
    }
    return getSnsPostGetter(options);
}
