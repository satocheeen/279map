"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureType = exports.MapKind = exports.Auth = void 0;
var Auth;
(function (Auth) {
    Auth["View"] = "View";
    Auth["Edit"] = "Edit";
})(Auth = exports.Auth || (exports.Auth = {}));
var MapKind;
(function (MapKind) {
    MapKind["Real"] = "Real";
    MapKind["Virtual"] = "Virtual";
})(MapKind = exports.MapKind || (exports.MapKind = {}));
var FeatureType;
(function (FeatureType) {
    FeatureType["STRUCTURE"] = "STRUCTURE";
    FeatureType["ROAD"] = "ROAD";
    FeatureType["EARTH"] = "EARTH";
    FeatureType["FOREST"] = "FOREST";
    FeatureType["AREA"] = "AREA";
})(FeatureType = exports.FeatureType || (exports.FeatureType = {}));
