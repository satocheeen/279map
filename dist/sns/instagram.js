"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _InstagramPostGetter_option;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FbGraphApiInstagramBusinessAccountId = exports.FbGraphApiAccessToken = void 0;
const axios_1 = __importDefault(require("axios"));
const utility_1 = require("./utility");
exports.FbGraphApiAccessToken = process.env.FB_GRAPH_API_TOKEN || '';
exports.FbGraphApiInstagramBusinessAccountId = process.env.FB_GRAPH_INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
class InstagramPostGetter {
    constructor(option) {
        _InstagramPostGetter_option.set(this, void 0);
        __classPrivateFieldSet(this, _InstagramPostGetter_option, option, "f");
    }
    /**
     * 指定のURLがInstagramの
     * @param url
     * @returns
     */
    static checkUrl(url) {
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
            };
        }
        return null;
    }
    get type() {
        return 'InstagramUser';
    }
    getPosts(max) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield getInstagramPosts(__classPrivateFieldGet(this, _InstagramPostGetter_option, "f").userName);
            const result = posts.map(post => {
                // ハッシュタグ除去
                const extractRes = (0, utility_1.extractHashTag)(post.caption);
                const text = extractRes.text;
                return {
                    id: post.id,
                    text,
                    hashtags: extractRes.tags,
                    media: post.media_url ? {
                        type: post.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                        url: post.media_url,
                    } : undefined,
                    url: post.permalink,
                    date: post.timestamp,
                };
            });
            return result.slice(0, max);
        });
    }
}
exports.default = InstagramPostGetter;
_InstagramPostGetter_option = new WeakMap();
/**
 *
 * @param userName
 */
function getInstagramPosts(userName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = 'https://graph.facebook.com/v14.0/' + exports.FbGraphApiInstagramBusinessAccountId +
                '?fields=business_discovery.username(' + userName + '){media{caption,media_url,permalink,media_type,timestamp}}' +
                '&access_token=' + exports.FbGraphApiAccessToken;
            const result = yield (0, axios_1.default)({
                url,
            });
            const apiResult = result.data;
            return apiResult.business_discovery.media.data;
        }
        catch (e) {
            console.warn('Get Instagram Posts Failed.', e);
            return [];
        }
    });
}
