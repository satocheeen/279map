import { Request } from "express";
import { IncomingMessage } from "http";
import cookie from 'cookie';

export function getSessionIdFromCookies(req: Request | IncomingMessage): string | undefined {
    if (!req.headers.cookie) {
        console.log('not cookie');
        return;
    }
    const cookies = cookie.parse(req.headers.cookie);
    let sid = cookies["connect.sid"];
    if (!sid) {
        return;
    }
    // 冒頭のs:とピリオド以降を除去する
    const regex = /s:(.*)\.(.*)/
    const match = sid.match(regex);
    if (!match) {
        return;
    }
    if (match.length < 2) {
        return;
    }
    return match[1];
}