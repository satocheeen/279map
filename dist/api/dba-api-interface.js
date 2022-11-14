"use strict";
/**
 * Odba container's API interface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetImageUrlAPI = exports.LinkContentToItemAPI = exports.GetUnpointDataAPI = exports.UpdateContentAPI = exports.UpdateItemAPI = exports.RemoveContentAPI = exports.RemoveItemAPI = exports.RegistContentAPI = exports.RegistItemAPI = void 0;
/**
 * regist item
 */
exports.RegistItemAPI = {
    uri: 'regist-item',
    method: 'post',
}; // result = registed item ID
/**
 * regist content
 */
exports.RegistContentAPI = {
    uri: 'regist-content',
    method: 'post',
};
/**
 * remove item
 */
exports.RemoveItemAPI = {
    uri: 'remove-item',
    method: 'post',
};
/**
 * remove content
 */
exports.RemoveContentAPI = {
    uri: 'remove-content',
    method: 'post',
};
/**
 * update item
 */
exports.UpdateItemAPI = {
    uri: 'update-item',
    method: 'post',
};
/**
 * update content
 */
exports.UpdateContentAPI = {
    uri: 'update-content',
    method: 'post',
};
/**
 * get unpoint data
 */
exports.GetUnpointDataAPI = {
    uri: 'get-unpointdata',
    method: 'post',
};
/**
 * link content to item
 */
exports.LinkContentToItemAPI = {
    uri: 'link-content2item',
    method: 'post'
};
exports.GetImageUrlAPI = {
    uri: 'get-imageurl',
    method: 'get',
};
