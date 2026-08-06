import { ImageInfo } from "./types";

/**
 * 画像ロード用のImageオブジェクトを生成して返す
 * @param callback 画像ロード完了時のコールバック
 * @param errorCallback 画像ロード失敗時のコールバック
 */
 export function createImageForLoad(param: {
    callback: (image: ImageInfo) => void, 
    errorCallback?: () => void,
    maxOriginalSize?:number,    // 大サイズ画像長辺サイズ
    maxThumbSize?: number,      // サムネイル長辺サイズ
}): HTMLImageElement {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const LARGE_LONG_SIZE = param.maxOriginalSize ?? 1200;   // 大サイズ画像長辺サイズ
        const THUMB_LONG_SIZE = param.maxThumbSize ?? 150;   // サムネイル長辺サイズ
        const kind = img.src.indexOf('image/png') !== -1 ? 'png' : 'jpeg';

        const image = {
            original: createImageShrink(img, LARGE_LONG_SIZE, kind),
            thumb: createImageShrink(img, THUMB_LONG_SIZE, kind),
        };
        param.callback(image);
    };
    img.onerror = (err) => {
        console.warn('err', err);
        if (param.errorCallback !== undefined) {
            param.errorCallback();
        }
    };
    return img;
}
/**
 * 縮小画像作成
 * @param org {HTMLImageElement} 元画像
 * @param longSize {number} 縮小後の長辺サイズ. 元画像サイズよりも大きい場合は縮小しない。
 * @returns 縮小後画像のBase64文字列
 */
 function createImageShrink(org: HTMLImageElement, longSize: number, kind: 'jpeg' | 'png'): string {
    const width = org.width;
    const height = org.height;
    let cnvsH;
    let cnvsW;

    if (width < longSize && height < longSize) {
        // 指定の長辺サイズよりもサイズが小さい場合は縮小しない
        cnvsW = width;
        cnvsH = height;
    } else {
        if (width > height) {
            cnvsW = longSize;
            cnvsH = height * cnvsW / width;
        } else {
            cnvsH = longSize;
            cnvsW = width * cnvsH / height;
        }
    }

    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.setAttribute('width', cnvsW + '');
    canvas.setAttribute('height', cnvsH + '');
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        console.warn('create image failed.');
        return '';
    }
    ctx.drawImage(org, 0, 0, cnvsW, cnvsH);
    return canvas.toDataURL('image/' + kind);
}
