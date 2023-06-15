import { Configuration } from "log4js";
import { PoolOptions } from "mysql2";

export const MapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN || '';

export const LogSetting = {
    "appenders" : {
        "systemFile" : {
            type : "file",
            filename : process.env.LOG_DIR_PATH + "main-system.log",
            maxLogSize: 3 * 1024 * 1024,
            backups: 5,
        },
        "apiFile" : {
            type : "file",
            filename : process.env.LOG_DIR_PATH + "main-api.log",
            maxLogSize: 3 * 1024 * 1024,
            backups: 5,
        },
        "console": {
            type: 'console',
        }
    },
    "categories" : {
        "default" : {
            "appenders" : process.env.ENV === 'dev' ? ["systemFile", "console"] : ["systemFile"],
            level : process.env.LOG_LEVEL as string,
        },
        "api" : {
            "appenders" : process.env.ENV === 'dev' ? ["apiFile", "console"] : ["apiFile"],
            "level" : process.env.LOG_LEVEL as string,
        }
    }
} as Configuration;

export const DbSetting: PoolOptions = {
    connectionLimit : parseInt(process.env.CONNECTION_LIMIT ?? '100'),
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT ?? '3036'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectTimeout: parseInt(process.env.CONNECT_TIMEOUT ?? '5000'),
}
