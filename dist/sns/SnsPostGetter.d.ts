import { InstagramContentOptions } from "./instagram";
export declare type SnsPost = {
    id: string;
    text: string;
    hashtags: string[];
    url: string;
    media?: {
        type: 'IMAGE' | 'VIDEO';
        url: string;
    };
    date: string;
};
export interface SnsPostGetter {
    type: SnsOptions['type'];
    getPosts(max: number): Promise<SnsPost[]>;
}
export declare type SnsOptions = InstagramContentOptions;
/**
 * 指定のURLに対応するSNS定義情報を返す
 * @param url
 * @returns SNS定義情報。これを用いてgetSnsPostGetterで投稿を取得する。対応するものがない場合は、nullを返却。
 */
export declare function getSnsOptionByUrl(url: string): SnsOptions | null;
/**
 * 指定のオプションに対応するSnsPostGetterを返す
 * @param options
 * @returns
 */
export declare function getSnsPostGetter(options: SnsOptions): SnsPostGetter | null;
/**
 * 指定のURLに対応するSnsPostGetterを返す
 * @param url
 * @returns
 */
export declare function getSnsPostGetterByUrl(url: string): SnsPostGetter | null;
