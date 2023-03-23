import proj4 from 'proj4';
import axios from 'axios';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import { MapKind } from './279map-common';
import { DataSourceKind } from './types/schema';

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

type ImageInfo = {
    base64: string;
    gps?: {latitude: number; longitude: number};
}

type GetImageBase64Option = {
    size: {
        width: number;
        height: number;
    }
}

export async function getImageBase64(url: string, option: GetImageBase64Option): Promise<ImageInfo> {
    try {
        const response = (await axios({ url, responseType: "arraybuffer" }));
        const input = response.data as ArrayBuffer;
        // console.log('status', response.status, response.headers, input.byteLength, input);
        const src = sharp(new Uint8Array(input));
        const format = (await src.metadata()).format;
        const buff = await src.resize(option.size.width, option.size.height, {
            fit: 'cover',
            background: {r: 255, g: 255, b: 255, alpha: 0},
        }).toBuffer();
    
        const base64 = buff.toString('base64');
    
        const tags = ExifReader.load(input);
        const latitude = Number(tags.GPSLatitude?.description);
        const longitude = Number(tags.GPSLongitude?.description);
    
        return {
            base64: (format ? format + ';' : '') + 'base64,' + base64,
            gps: latitude && longitude ? {
                latitude, longitude
            } : undefined,
        };

    } catch(e) {
        console.warn('getImageBase64 error', url);
        return {
            base64: ''
        };
    }
}

/**
 * 指定の地図種別に対応するDataSourceKindを返す
 * @param mapKind 
 * @returns 
 */
export function getDataSourceKindsFromMapKind(mapKind: MapKind, contain: {item?: boolean; content?: boolean; track?: boolean}): DataSourceKind[] {
    const kindSet = new Set<DataSourceKind>();
    if (contain.item) {
        if (mapKind === MapKind.Real) {
            kindSet.add(DataSourceKind.RealItem);
            kindSet.add(DataSourceKind.RealItemContent);
        } else {
            kindSet.add(DataSourceKind.VirtualItem);
        }
    }
    if (contain.content) {
        kindSet.add(DataSourceKind.Content);
        if (mapKind === MapKind.Real) {
            kindSet.add(DataSourceKind.RealItemContent);
        }
    }
    if (contain.track) {
        if (mapKind === MapKind.Real) {
            kindSet.add(DataSourceKind.RealTrack);
        }
    }

    return Array.from(kindSet);
}
