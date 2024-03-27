import proj4 from 'proj4';
import axios from 'axios';
import sharp from 'sharp';

export const sleep = (sec: number) => new Promise<void>((resolve) => {
    setTimeout(() => {
        resolve();
    }, sec * 1000);
});

/**
 * kmの長さを緯度経度座標での数値に変換する
 * @param p 中心座標
 * @param km km
 * @return 緯度経度座標での値
 */
 export function convertKmToLonLat(p: number[], km: number): number {
    const heimenProjection = "+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
    // 1. 平面座標系に変換
    const pos1 = proj4("EPSG:4326", heimenProjection, p);
    // 2. radius(km)を足す
    pos1[0] += 1000 * km;
    // 3. 緯度経度座標に戻す
    const pos2 = proj4(heimenProjection, "EPSG:4326", pos1);
    // 4. 距離を計測
    const r = Math.sqrt(Math.pow(pos2[0] - p[0], 2) + Math.pow(pos2[1] - p[1], 2));
    return r;
}

type GetImageBase64Size = {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain';
}

/**
 * 指定のURL画像をBase64に変換して返す。
 * @param url 
 * @param sizes 変換後サイズ情報の配列。指定した分だけBase64画像を生成して返す。
 * @returns Base64。sizeで指定した分だけ配列で加瀬素。画像取得に失敗した場合は、undefined。
 */
export async function getImageBase64(url: string, sizes: GetImageBase64Size[]): Promise<string[]|undefined> {
    try {
        const response = (await axios({ url, responseType: "arraybuffer" }));
        const input = response.data as ArrayBuffer;
        // console.log('status', response.status, response.headers, input.byteLength, input);
        const src = sharp(new Uint8Array(input));
        const format = (await src.metadata()).format;

        // resize
        const base64list = Promise.all(sizes.map(async(size) => {
            const buff = await src.resize(size.width, size.height, {
                fit: size.fit ?? 'cover',
                background: {r: 255, g: 255, b: 255, alpha: 0},
            }).toBuffer();
            return (format ? format + ';' : '') + 'base64,' + buff.toString('base64');
        }))

        return base64list;

    } catch(e) {
        return;
    }
}
