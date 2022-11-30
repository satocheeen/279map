/// <reference types="multer" />
import { api } from '279map-common';
export declare function callOdbaApi<API extends api.APIDefine<any, any>>(api: API, param: API['param']): Promise<API['result']>;
/**
 * regist file to File Service
 * @param file the file you want to save
 * @returns the url to access the file
 */
export declare function registFile(file: Express.Multer.File): Promise<string>;
