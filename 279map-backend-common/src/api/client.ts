import { APIDefine } from '279map-common';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

export async function callOdbaApi<API extends APIDefine<any,any>>(api: API, param: API['param']): Promise<API['result']> {
    const url = `http://${process.env.ODBA_SERVICE_HOST}:${process.env.ODBA_SERVICE_PORT}/${api.uri}/`;
    try {
        let res: AxiosResponse;
        if (api.method === 'get') {
            res = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: param,
                timeout: 10000,
            });
        } else {
            res = await axios.post(url, param, {
                timeout: 10000,
            });
        }
        if (res.status !== 200) {
            throw res.statusText + res.data;
        }
        const result = res.data;

        return result as API['result'];
    
    } catch (e) {
        throw 'connecting server failed:' + url + e;
    }
}

/**
 * regist file to File Service
 * @param file the file you want to save
 * @returns the url to access the file
 */
export async function registFile(file: Express.Multer.File): Promise<string> {
    const url = `http://${process.env.FS_SERVICE_HOST}:${process.env.FS_SERVICE_PORT}/registfile/`;

    const form = new FormData();
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
            })
        });
    });
}