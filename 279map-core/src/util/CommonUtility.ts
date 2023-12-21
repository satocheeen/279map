import { Auth } from "../graphql/generated/graphql";
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

export const sleep = (sec: number) => new Promise<void>((resolve) => {
    setTimeout(() => {
        resolve();
    }, sec * 1000);
});

export function compareAuth(a: Auth, b: Auth) {
    const weightFunc = (auth: Auth) => {
        switch(auth) {
            case Auth.None:
            case Auth.Request:
                return 0;
            case Auth.View:
                return 1;
            case Auth.Edit:
                return 2;
            case Auth.Admin:
                return 3;
        }
    }
    const aWeight = weightFunc(a);
    const bWeight = weightFunc(b);
    return aWeight - bWeight;
}