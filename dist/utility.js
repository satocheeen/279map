"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageBase64 = exports.convertKmToLonLat = exports.sleep = void 0;
const proj4_1 = __importDefault(require("proj4"));
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const exifreader_1 = __importDefault(require("exifreader"));
const sleep = (sec) => new Promise((resolve) => {
    setTimeout(() => {
        resolve();
    }, sec * 1000);
});
exports.sleep = sleep;
/**
 * kmの長さを緯度経度座標での数値に変換する
 * @param p 中心座標
 * @param km km
 * @return 緯度経度座標での値
 */
function convertKmToLonLat(p, km) {
    const heimenProjection = "+proj=tmerc +lat_0=44 +lon_0=142.25 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
    // 1. 平面座標系に変換
    const pos1 = (0, proj4_1.default)("EPSG:4326", heimenProjection, p);
    // 2. radius(km)を足す
    pos1[0] += 1000 * km;
    // 3. 緯度経度座標に戻す
    const pos2 = (0, proj4_1.default)(heimenProjection, "EPSG:4326", pos1);
    // 4. 距離を計測
    const r = Math.sqrt(Math.pow(pos2[0] - p[0], 2) + Math.pow(pos2[1] - p[1], 2));
    return r;
}
exports.convertKmToLonLat = convertKmToLonLat;
function getImageBase64(url, option) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = (yield (0, axios_1.default)({ url, responseType: "arraybuffer" }));
            const input = response.data;
            // console.log('status', response.status, response.headers, input.byteLength, input);
            const src = (0, sharp_1.default)(new Uint8Array(input));
            const format = (yield src.metadata()).format;
            const buff = yield src.resize(option.size.width, option.size.height, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 },
            }).toBuffer();
            const base64 = buff.toString('base64');
            const tags = exifreader_1.default.load(input);
            const latitude = Number((_a = tags.GPSLatitude) === null || _a === void 0 ? void 0 : _a.description);
            const longitude = Number((_b = tags.GPSLongitude) === null || _b === void 0 ? void 0 : _b.description);
            return {
                base64: (format ? format + ';' : '') + 'base64,' + base64,
                gps: latitude && longitude ? {
                    latitude, longitude
                } : undefined,
            };
        }
        catch (e) {
            console.warn('getImageBase64 error', url);
            return {
                base64: ''
            };
        }
    });
}
exports.getImageBase64 = getImageBase64;
