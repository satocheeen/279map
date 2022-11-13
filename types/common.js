"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureType = exports.MapKind = void 0;
/**
 * システム全体（フロントエンド、バックエンド）で共通の型定義
 */
var MapKind;
(function (MapKind) {
    MapKind["Real"] = "Real";
    MapKind["Virtual"] = "Virtual";
})(MapKind = exports.MapKind || (exports.MapKind = {}));
/**
 * 地物種別
 * (DBに登録するので、後から増減可能なように文字列型にしている)
 */
var FeatureType;
(function (FeatureType) {
    FeatureType["STRUCTURE"] = "STRUCTURE";
    FeatureType["ROAD"] = "ROAD";
    FeatureType["EARTH"] = "EARTH";
    FeatureType["FOREST"] = "FOREST";
    FeatureType["AREA"] = "AREA";
})(FeatureType = exports.FeatureType || (exports.FeatureType = {}));
