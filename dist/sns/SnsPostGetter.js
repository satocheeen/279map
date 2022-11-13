"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnsPostGetterByUrl = exports.getSnsPostGetter = exports.getSnsOptionByUrl = void 0;
const instagram_1 = __importDefault(require("./instagram"));
/**
 * 指定のURLに対応するSNS定義情報を返す
 * @param url
 * @returns SNS定義情報。これを用いてgetSnsPostGetterで投稿を取得する。対応するものがない場合は、nullを返却。
 */
function getSnsOptionByUrl(url) {
    const instagram = instagram_1.default.checkUrl(url);
    if (instagram) {
        return instagram;
    }
    return null;
}
exports.getSnsOptionByUrl = getSnsOptionByUrl;
/**
 * 指定のオプションに対応するSnsPostGetterを返す
 * @param options
 * @returns
 */
function getSnsPostGetter(options) {
    if (options.type === 'InstagramUser') {
        return new instagram_1.default(options);
    }
    return null;
}
exports.getSnsPostGetter = getSnsPostGetter;
/**
 * 指定のURLに対応するSnsPostGetterを返す
 * @param url
 * @returns
 */
function getSnsPostGetterByUrl(url) {
    const options = getSnsOptionByUrl(url);
    if (!options) {
        return null;
    }
    return getSnsPostGetter(options);
}
exports.getSnsPostGetterByUrl = getSnsPostGetterByUrl;
