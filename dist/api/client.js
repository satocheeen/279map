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
exports.registFile = exports.callOdbaApi = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
function callOdbaApi(api, param) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `http://${process.env.ODBA_SERVICE_HOST}:${process.env.ODBA_SERVICE_PORT}/${api.uri}/`;
        try {
            let result;
            if (api.method === 'get') {
                const res = yield axios_1.default.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    params: param,
                });
                result = res.data;
            }
            else {
                const res = yield axios_1.default.post(url, param);
                result = res.data;
            }
            return result;
        }
        catch (e) {
            throw 'connecting server failed:' + url + e;
        }
    });
}
exports.callOdbaApi = callOdbaApi;
/**
 * regist file to File Service
 * @param file the file you want to save
 * @returns the url to access the file
 */
function registFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `http://${process.env.FS_SERVICE_HOST}:${process.env.FS_SERVICE_PORT}/registfile/`;
        const form = new form_data_1.default();
        const buffer = file.buffer;
        form.append('myfile', buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: buffer.length,
        });
        // using form-data submit because using axios is failed...
        return new Promise((resolve, reject) => {
            form.submit(url, (err, res) => {
                if (res.statusCode !== 200) {
                    reject(err);
                    return;
                }
                let body = "";
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve(body);
                });
            });
        });
    });
}
exports.registFile = registFile;
