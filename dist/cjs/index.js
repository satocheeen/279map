'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const GetMapInfoAPI = {
    uri: 'getmapinfo',
    method: 'post',
};
const GetOriginalIconDefineAPI = {
    uri: 'get-original-icon-define',
    method: 'post',
};
const GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
};
const GetCategoryAPI = {
    uri: 'getcategory',
    method: 'post',
};
const GetEventsAPI = {
    uri: 'getevents',
    method: 'post',
};
const GetItemsAPI = {
    uri: 'getitems',
    method: 'post',
};
const GetContentsAPI = {
    uri: 'getcontents',
    method: 'post',
};
const RegistItemAPI = {
    uri: 'registitem',
    method: 'post',
};
const UpdateItemAPI = {
    uri: 'updateitem',
    method: 'post',
};
const RemoveItemAPI = {
    uri: 'removeitem',
    method: 'post',
};
const RegistContentAPI = {
    uri: 'registcontent',
    method: 'post',
};
const UpdateContentAPI = {
    uri: 'updatecontent',
    method: 'post',
};
const RemoveContentAPI = {
    uri: 'removecontent',
    method: 'post',
};
const LinkContentToItemAPI = {
    uri: 'link-content2item',
    method: 'post',
};
const GetSnsPreviewAPI = {
    uri: 'getsnspreview',
    method: 'post',
};
const GeocoderAPI = {
    uri: 'geocoder',
    method: 'get',
};

var api = /*#__PURE__*/Object.freeze({
    __proto__: null,
    GetMapInfoAPI: GetMapInfoAPI,
    GetOriginalIconDefineAPI: GetOriginalIconDefineAPI,
    GetUnpointDataAPI: GetUnpointDataAPI,
    GetCategoryAPI: GetCategoryAPI,
    GetEventsAPI: GetEventsAPI,
    GetItemsAPI: GetItemsAPI,
    GetContentsAPI: GetContentsAPI,
    RegistItemAPI: RegistItemAPI,
    UpdateItemAPI: UpdateItemAPI,
    RemoveItemAPI: RemoveItemAPI,
    RegistContentAPI: RegistContentAPI,
    UpdateContentAPI: UpdateContentAPI,
    RemoveContentAPI: RemoveContentAPI,
    LinkContentToItemAPI: LinkContentToItemAPI,
    GetSnsPreviewAPI: GetSnsPreviewAPI,
    GeocoderAPI: GeocoderAPI
});

exports.Auth = void 0;
(function (Auth) {
    Auth["View"] = "View";
    Auth["Edit"] = "Edit";
})(exports.Auth || (exports.Auth = {}));
exports.MapKind = void 0;
(function (MapKind) {
    MapKind["Real"] = "Real";
    MapKind["Virtual"] = "Virtual";
})(exports.MapKind || (exports.MapKind = {}));
exports.FeatureType = void 0;
(function (FeatureType) {
    FeatureType["STRUCTURE"] = "STRUCTURE";
    FeatureType["ROAD"] = "ROAD";
    FeatureType["EARTH"] = "EARTH";
    FeatureType["FOREST"] = "FOREST";
    FeatureType["AREA"] = "AREA";
})(exports.FeatureType || (exports.FeatureType = {}));

exports.api = api;
//# sourceMappingURL=index.js.map
