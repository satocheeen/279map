import { Express } from 'express';
import { Logger } from 'log4js';
import { AuthManagementInterface } from './AuthManagementInterface';

export function initializeOriginalAuth(app: Express, authManagement: AuthManagementInterface, logger: Logger) {
    app.post('/auth/initialize', async(req, res) => {
        logger.info('[start] auth initialize');
        try {
            await authManagement.initialize();
            res.send('initialized');

        } catch(e) {
            logger.warn(e);
            res.status(500).send('auth initialize failed.');

        } finally {
            logger.info('[end] auth initialize');

        }
    });

    app.post('/auth/check-jwt', 
        authManagement.checkJwt,
        async(req, res, next) => {
            res.send('checkJwt ok');
        }
    );

    app.post('/auth/get-user-map-list', async(req, res) => {
        logger.info('[start] auth getUserMapList');
        try {
            const param = req.body;
            const result = await authManagement.getUserMapList(param.userId);
            res.send(result);

        } catch(e) {
            logger.warn(e);
            res.status(500).send('auth getUserMapList failed.');

        } finally {
            logger.info('[end] auth getUserMapList');

        }
    });

    app.post('/auth/get-userinfo-of-map', async(req, res) => {
        logger.info('[start] auth getUserInfoOfTheMap');
        try {
            const param = req.body;
            const result = await authManagement.getUserInfoOfTheMap(param.userId, param.mapId);
            res.send(result);

        } catch(e) {
            logger.warn(e);
            res.status(500).send('auth getUserInfoOfTheMap failed.');

        } finally {
            logger.info('[end] auth getUserInfoOfTheMap');

        }
    });

}