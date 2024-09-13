import { PoolConnection } from "mysql2/promise";
import { ConnectionPool } from "../..";
import { ContentsTable, CurrentMap, DataSourceTable, MapDataSourceLinkTable } from "../../../279map-backend-common/src";
import { convertContentsToContentsDefine, convertContentsToContentsDetail } from "../../api-common/convertContent";
import { ContentsDefine } from "../../graphql/__generated__/types";
import { DataId } from "../../types-common/common-types";
import { getLogger } from "log4js";

const apiLogger = getLogger('api');

type Param = {
    dataId: DataId;
    currentMap: CurrentMap;
}

export async function getContentDefine({ dataId, currentMap }: Param): Promise<Omit<ContentsDefine, 'linkedContents'> | null> {
    const con = await ConnectionPool.getConnection();

    try {
        const record = await getContentRecord(con, { dataId, currentMap });
        const content = await convertContentsToContentsDefine(con, record);

        return content;

    } catch(err) {
        return null;

    } finally {
        con.release();
    }
}

export async function getContentDetail({ dataId, currentMap }: Param) {
    const con = await ConnectionPool.getConnection();

    try {
        const record = await getContentRecord(con, { dataId, currentMap });
        const content = await convertContentsToContentsDetail(con, record, currentMap);

        return content;

    } catch(err) {
        return null;

    } finally {
        con.release();
    }
}

async function getContentRecord(con: PoolConnection, { dataId, currentMap }: Param) {
    try {
        // 指定のdataIdのコンテンツを取得
        const sql = `
        select * from datas d 
        inner join contents c on c.data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        where mdl.map_page_id = ? and d.data_id = ?
        `;

        const [rows] = await con.query(sql, [currentMap.mapId, dataId]);
        if ((rows as []).length === 0) {
            throw new Error('data not find');
        }
        const record = (rows as (ContentsTable & DataSourceTable & MapDataSourceLinkTable)[])[0];
        return record;

    } catch(err) {
        apiLogger.warn('get data records failed', err);
        throw err;
    }
    
}

