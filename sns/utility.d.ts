declare type ExtractHashTagResult = {
    tags: string[];
    text: string;
};
/**
 * 指定の文字列内からハッシュタグを抽出する。
 * @param text
 */
export declare function extractHashTag(text: string): ExtractHashTagResult;
export {};
