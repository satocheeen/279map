import React, { useCallback, useState } from 'react';
import { ContentValueInput } from '../../entry';

type ImageValue = Extract<ContentValueInput, { type: 'image' }>['value'];
type Props = {
  onChange?: (val: ImageValue) => void;
}

export default function ImageForm(props: Props) {
  const [errMsg, setErrMsg] = useState('');

  const handleFileSelected = useCallback((event: React.FormEvent) => {
    const files = (event.target as any).files as FileList;
    if (files.length === 0) {
      return;
    }
    const file = files[0];

    // 画像ロード用のImageオブジェクトを生成して返す
    const img = createImageForLoad({
      maxSize: 1200,
      callback: (base64: string) => {
        if (props.onChange) {
          props.onChange([{
            type: 'base64',
            base64,
            fileName: file.name,
          }]);
        }
      },
      errorCallback: () => {
        setErrMsg('この画像は取得できません.');
      }
    });
    var reader = new FileReader();
    reader.onload = (evt) => {
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [props]);


  return (
    <>
      <input type='file' data-browse="選択" accept="image" onChange={(e: React.FormEvent) => handleFileSelected(e)} />
      <p>{errMsg}</p>
    </>
  );
}


/**
 * 画像ロード用のImageオブジェクトを生成して返す
 * @param callback 画像ロード完了時のコールバック
 * @param errorCallback 画像ロード失敗時のコールバック
 */
function createImageForLoad(param: {
  callback: (base64: string) => void,
  errorCallback?: () => void,
  maxSize?: number,    // 画像長辺サイズ
}): HTMLImageElement {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const LARGE_LONG_SIZE = param.maxSize ? param.maxSize : 1200;   // 大サイズ画像長辺サイズ
    const kind = img.src.indexOf('image/png') !== -1 ? 'png' : 'jpeg';

    const image = createImageShrink(img, LARGE_LONG_SIZE, kind);
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
const createImageShrink = (org: HTMLImageElement, longSize: number, kind: 'jpeg' | 'png'): string => {
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
