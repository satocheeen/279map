type ExtractHashTagResult = {
    tags: string[];
    text: string;   // ハッシュタグを除去した後のテキスト
}

/**
 * 指定の文字列内からハッシュタグを抽出する。
 * @param text 
 */
 export function extractHashTag(text: string): ExtractHashTagResult {
    const regex = /#([^ \n]*)/g;
    const hit = text.match(regex);
    if (!hit) {
        return {
            tags: [],
            text,
        };
    }
    const tags = [] as string[];
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