"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHashTag = void 0;
/**
 * 指定の文字列内からハッシュタグを抽出する。
 * @param text
 */
function extractHashTag(text) {
    const regex = /#([^ \n]*)/g;
    const hit = text.match(regex);
    if (!hit) {
        return {
            tags: [],
            text,
        };
    }
    const tags = [];
    hit.forEach((h) => {
        // 冒頭#を抜いた文字列を格納
        tags.push(h.substring(1));
    });
    // ハッシュタグをtextから除去
    let newText = text.replace(regex, '');
    // 末尾の空白、改行をtrim
    newText = newText.replace(/[ \n]*$/, '');
    return {
        tags,
        text: newText,
    };
}
exports.extractHashTag = extractHashTag;
