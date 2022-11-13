import { SnsOptions, SnsPost, SnsPostGetter } from './SnsPostGetter';
export declare const FbGraphApiAccessToken: string;
export declare const FbGraphApiInstagramBusinessAccountId: string;
export declare type InstagramContentOptions = {
    type: 'InstagramUser';
    userName: string;
};
export default class InstagramPostGetter implements SnsPostGetter {
    #private;
    /**
     * 指定のURLがInstagramの
     * @param url
     * @returns
     */
    static checkUrl(url: string): InstagramContentOptions | null;
    constructor(option: InstagramContentOptions);
    get type(): SnsOptions['type'];
    getPosts(max: number): Promise<SnsPost[]>;
}
