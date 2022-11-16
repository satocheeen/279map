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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registAPIs = exports.initializeOdba = void 0;
const dba_api_interface_1 = require("./dba-api-interface");
function initializeOdba(app, odba, logger) {
    const apiList = [
        {
            define: dba_api_interface_1.RegistItemAPI,
            func: odba.registItem,
        },
        {
            define: dba_api_interface_1.RegistContentAPI,
            func: odba.registContent,
        },
        {
            define: dba_api_interface_1.RemoveItemAPI,
            func: odba.removeItem,
        },
        {
            define: dba_api_interface_1.RemoveContentAPI,
            func: odba.removeContent,
        },
        {
            define: dba_api_interface_1.UpdateItemAPI,
            func: odba.updateItem,
        },
        {
            define: dba_api_interface_1.UpdateContentAPI,
            func: odba.updateContent,
        },
        {
            define: dba_api_interface_1.GetUnpointDataAPI,
            func: odba.getUnpointData,
        },
        {
            define: dba_api_interface_1.LinkContentToItemAPI,
            func: odba.linkContentToItem,
        },
        {
            define: dba_api_interface_1.GetImageUrlAPI,
            func: odba.getImageUrl,
        },
    ];
    registAPIs(app, apiList, logger);
}
exports.initializeOdba = initializeOdba;
function registAPIs(app, apiList, logger) {
    apiList.forEach((api => {
        const getParam = (req) => {
            if (api.define.method === 'post') {
                console.log('req body', req.body);
                return req.body;
            }
            else {
                return req.query;
            }
        };
        const execute = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const param = getParam(req);
                logger.info('[start] ' + api.define.uri, param);
                const result = yield api.func({ param });
                let doSend = true;
                if (api.after) {
                    doSend = api.after({ param, result, req, res });
                }
                logger.info('[end] ' + api.define.uri);
                logger.debug('result', result);
                if (doSend) {
                    res.send(result);
                }
            }
            catch (e) {
                logger.warn(api.define.uri + ' error', e);
                res.status(500).send(e);
            }
        });
        if (api.define.method === 'post') {
            app.post('/' + api.define.uri, execute);
        }
        else {
            app.get('/' + api.define.uri, execute);
        }
    }));
}
exports.registAPIs = registAPIs;
