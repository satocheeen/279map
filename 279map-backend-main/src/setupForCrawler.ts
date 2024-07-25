import { NextFunction, Request, Response } from "express";
import { getMapInfoByIdWithAuth } from "./getMapDefine";
import { CustomError } from "./graphql/CustomError";
import { ConnectErrorType } from "./graphql/__generated__/types";
import { getLogger } from "log4js";

const logger = getLogger();

/**
 * SNS等のクローラー向けにメタ情報を生成して返す
 */
export const setupForCrawler = async(req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    if (!userAgent) {
        next();
        return;
    }
    const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit/i.test(userAgent);
    if (!isCrawler) {
        next();
        return;
    }

    try {
        const mapId = req.path.length > 2 ? req.path.substring(1) : undefined;
        logger.debug('Crawler', req.path);
        const metaInfo = await async function() {
            const info = {
                title: 'つなぐマップ',
                description: '情報をつなげる。楽しくつなげる。',
                image: 'static/279map.png',
            }
            if (mapId) {
                try {
                    const { mapInfo } = await getMapInfoByIdWithAuth(mapId, req);
                    info.title = mapInfo.title + ' by つなぐマップ';
                    if (mapInfo.description) {
                        info.description = mapInfo.description;
                    }
                    if (mapInfo.thumbnail) {
                        info.image = 'mapimage/' + mapId;
                    }

                } catch(e) {
                    if (e instanceof CustomError) {
                        if (e.type === ConnectErrorType.UndefinedMap) {
                            throw new Error('Undefied Map');
                        }
                    }
                    // アクセス権限が必要な地図の場合は、デフォルトのメタ情報を表示
                    logger.debug('access denied and default meta')
                }
            }

            return info;
        }();

        // og:imageは絶対URLを指定
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const domain = `${protocol}://${host}/`;
        const imageUrl = `${domain}${metaInfo.image}`;

        const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${metaInfo.title}</title>
            <meta name="description" content="${metaInfo.description}">
            <meta property="og:title" content="${metaInfo.title}">
            <meta property="og:url" content="${domain}${mapId ?? ''}">
            <meta property="og:type" content="website">
            <meta property="og:description" content="${metaInfo.description}">
            <meta property="og:image" content="${imageUrl}">

            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content="${domain}" />
            <meta property="twitter:title" content="${metaInfo.title}" />
            <meta property="twitter:description" content="${metaInfo.description}" />
            <meta property="twitter:image" content="${imageUrl}" />

        </head>
        <body>
            <div id="root">This is a page for Crawler.</div>
        </body>
        </html>
        `;
        logger.debug(html);

        res.send(html);
    } catch (e) {
        res.status(400).send('Illegal Parameters');
    }
}