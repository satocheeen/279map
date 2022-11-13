export declare const sleep: (sec: number) => Promise<void>;
/**
 * kmの長さを緯度経度座標での数値に変換する
 * @param p 中心座標
 * @param km km
 * @return 緯度経度座標での値
 */
export declare function convertKmToLonLat(p: number[], km: number): number;
declare type ImageInfo = {
    base64: string;
    gps?: {
        latitude: number;
        longitude: number;
    };
};
declare type GetImageBase64Option = {
    size: {
        width: number;
        height: number;
    };
};
export declare function getImageBase64(url: string, option: GetImageBase64Option): Promise<ImageInfo>;
export {};
