import { UrlType } from "../types/types";
import * as olColor from 'ol/color';

export function getUrlType(url: string): UrlType {
    if (/^(.*)facebook(.*)\/videos\//.test(url)) {
        return UrlType.FacebookVideo;
    }

    if (/^(.*)note\.com(.*)\//.test(url)) {
        return UrlType.Note;
    }

    if (/^(.*)twitter\.com(.*)\//.test(url)) {
        return UrlType.Twitter;
    }

    return UrlType.Other;
}

export function colorWithAlpha(color: string, alpha: number) {
    const [r, g, b] = Array.from(olColor.asArray(color));
    return olColor.asString([r, g, b, alpha]);
}
