import { Configuration } from "log4js";

export const MapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN || '';
export const SessionSecretKey = process.env.SESSION_SECRET_KEY || '';

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

export const DbSetting = {
    connectionLimit : 100,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectTimeout: 5000,
}
